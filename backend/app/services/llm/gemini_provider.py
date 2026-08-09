import json
import re
import asyncio
import random
from pathlib import Path
import google.generativeai as genai
import json_repair
from app.config import settings
from app.services.llm.base_provider import LLMProvider
from app.utils.logger import logger

async def retry_with_backoff(func, *args, max_retries=3, initial_delay=2.0, **kwargs):
    """
    Retries an async function call using exponential backoff with random jitter.
    Gracefully handles transient network timeouts and rate limit errors (HTTP 429).
    """
    retries = 0
    delay = initial_delay
    while True:
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            retries += 1
            if retries > max_retries:
                logger.error(f"Function call failed after {max_retries} retry attempts: {e}")
                raise e
                
            jitter = random.uniform(0.8, 1.2)
            sleep_time = delay * jitter
            logger.warning(f"Gemini API call warning: '{e}'. Retrying attempt {retries}/{max_retries} in {sleep_time:.2f}s...")
            await asyncio.sleep(sleep_time)
            delay *= 2.0

def clean_json_text(text: str) -> str:
    """
    Sanitizes raw JSON strings returned by LLMs:
    - Strips markdown code blocks (e.g. ```json ... ```)
    - Auto-repairs missing delimiters, unescaped characters, or missing closing braces using json-repair.
    """
    if not text:
        return "{}"
        
    text = text.strip()
    
    # Strip markdown block wrappers
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
        
    text = text.strip()
    
    try:
        # Use json_repair to robustly fix trailing commas, unescaped quotes, and missing closing brackets/braces
        repaired = json_repair.repair_json(text)
        return repaired
    except Exception as e:
        logger.warning(f"json_repair failed: {e}. Falling back to regex cleaning.")
        # Strip trailing commas in JSON object keys or list items
        # Example: {"a": 1,} -> {"a": 1}
        text = re.sub(r',\s*([\]}])', r'\1', text)
        return text

class GeminiProvider(LLMProvider):
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY environment variable is missing. Gemini requests will fail.")
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model_name = "gemini-3.5-flash"
        self.model = genai.GenerativeModel(self.model_name)

    def _load_prompt(self, filename: str) -> str:
        prompt_path = Path(__file__).resolve().parent.parent.parent / "prompts" / filename
        try:
            with open(prompt_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Failed to load prompt template {filename}: {e}")
            raise RuntimeError(f"Prompt template {filename} not found.")

    async def _generate_content_async(self, prompt, generation_config=None, contents_payload=None):
        """Helper to run model.generate_content inside an executor if blocking."""
        loop = asyncio.get_event_loop()
        payload = contents_payload if contents_payload is not None else prompt
        
        # We run the synchronous genai SDK call in the default thread pool to avoid blocking FastAPI
        def call_gemini():
            if generation_config:
                return self.model.generate_content(payload, generation_config=generation_config)
            return self.model.generate_content(payload)
            
        response = await loop.run_in_executor(None, call_gemini)
        return response

    async def extract_resume(self, raw_text: str, rule_based_data: dict) -> dict:
        prompt_template = self._load_prompt("resume_extraction.md")
        
        # Fix: Replace manually to avoid str.format() brace KeyError crashes
        formatted_prompt = (
            prompt_template
            .replace("{rule_based_data}", json.dumps(rule_based_data, indent=2))
            .replace("{raw_text}", raw_text)
        )
        
        async def call_api():
            response = await self._generate_content_async(
                formatted_prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            from pathlib import Path

            debug_dir = Path("debug")
            debug_dir.mkdir(exist_ok=True)

            with open(debug_dir / "gemini_response.txt", "w", encoding="utf-8") as f:
                f.write(response.text)

            print("✅ Gemini response saved")
            json_str = clean_json_text(response.text)
            
            try:
                return json.loads(json_str)
            except Exception as json_err:
                logger.warning(f"Failed parsing resume JSON: {json_err}. Raw response text was:\n{response.text}")
                raise json_err

        try:
            logger.info("Sending resume raw text to Gemini for structured parsing...")
            extracted_data = await retry_with_backoff(call_api)
            logger.info("Successfully parsed resume via Gemini API.")
            return extracted_data
        except Exception as e:
            logger.error(f"All retry attempts for Gemini resume extraction failed: {e}")
            raise e

    async def extract_job(self, raw_text: str) -> dict:
        prompt_template = self._load_prompt("job_extraction.md")
        formatted_prompt = prompt_template.replace("{raw_text}", raw_text)
        
        async def call_api():
            response = await self._generate_content_async(
                formatted_prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            json_str = clean_json_text(response.text)
            return json.loads(json_str)

        try:
            logger.info("Sending job description to Gemini for parsing...")
            extracted_data = await retry_with_backoff(call_api)
            return extracted_data
        except Exception as e:
            logger.error(f"All retry attempts for Gemini job extraction failed: {e}")
            raise e

    async def generate_recommendation(self, candidate_data: dict, job_data: dict, match_scores: dict) -> dict:
        prompt_template = self._load_prompt("recommendation.md")
        
        # Fix: Replace manually to avoid str.format() brace KeyError crashes
        overall_score = match_scores.get("overall_score", 0.0)
        formatted_prompt = (
            prompt_template
            .replace("{candidate_data}", json.dumps(candidate_data, indent=2))
            .replace("{job_data}", json.dumps(job_data, indent=2))
            .replace("{match_scores}", json.dumps(match_scores, indent=2))
            .replace("{overall_score}", f"{overall_score:.1f}")
        )
        
        async def call_api():
            response = await self._generate_content_async(
                formatted_prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            from pathlib import Path

            debug_dir = Path("debug")
            debug_dir.mkdir(exist_ok=True)

            with open(debug_dir / "gemini_response.txt", "w", encoding="utf-8") as f:
                f.write(response.text)

            print("✅ Gemini response saved")
            json_str = clean_json_text(response.text)
            return json.loads(json_str)

        try:
            logger.info("Requesting matching recommendation from Gemini...")
            recommendation = await retry_with_backoff(call_api)
            return recommendation
        except Exception as e:
            logger.error(f"All retry attempts for Gemini recommendation generation failed: {e}")
            raise e

    async def summarize_candidate(self, raw_text: str) -> str:
        prompt_template = self._load_prompt("candidate_summary.md")
        formatted_prompt = prompt_template.replace("{raw_text}", raw_text)
        
        async def call_api():
            response = await self._generate_content_async(formatted_prompt)
            return response.text.strip()

        try:
            summary_text = await retry_with_backoff(call_api)
            return summary_text
        except Exception as e:
            logger.error(f"Gemini candidate summary failed: {e}")
            return "Unable to generate summary at this time."

    async def transcribe_image(self, image_bytes: bytes) -> str:
        """
        Uses multimodal Gemini model to perform OCR on a page image.
        Returns the raw transcribed text.
        """
        prompt = "Perform OCR on this image of a scanned resume page. Transcribe all text accurately, retaining layout block order if possible."
        image_part = {
            "mime_type": "image/png",
            "data": image_bytes
        }
        
        async def call_api():
            # Send prompt and image payload
            response = await self._generate_content_async(
                prompt=prompt,
                contents_payload=[prompt, image_part]
            )
            return response.text.strip()

        try:
            logger.info("Requesting multimodal OCR from Gemini...")
            transcription = await retry_with_backoff(call_api)
            logger.info(f"Successfully transcribed page image ({len(transcription)} chars).")
            return transcription
        except Exception as e:
            logger.error(f"Multimodal OCR transcription failed: {e}")
            raise e

    async def extract_vacancy(self, raw_text: str) -> dict:
        """
        Parses Demand Letters / Job Vacancy documents into structured JSON with positions.
        """
        prompt_template = self._load_prompt("vacancy_extraction.md")
        formatted_prompt = prompt_template.replace("{raw_text}", raw_text)
        
        async def call_api():
            response = await self._generate_content_async(
                formatted_prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            json_str = clean_json_text(response.text)
            return json.loads(json_str)

        try:
            logger.info("Sending vacancy document text to Gemini for structured parsing...")
            extracted_data = await retry_with_backoff(call_api)
            logger.info("Successfully parsed vacancy document via Gemini API.")
            return extracted_data
        except Exception as e:
            logger.error(f"All retry attempts for Gemini vacancy extraction failed: {e}")
            raise e

