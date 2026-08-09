from abc import ABC, abstractmethod

class LLMProvider(ABC):
    @abstractmethod
    async def extract_resume(self, raw_text: str, rule_based_data: dict) -> dict:
        """
        Parses complex resume fields using LLM, merging with rule-based data.
        Should return a dictionary conforming to the resume schema.
        """
        pass

    @abstractmethod
    async def extract_job(self, raw_text: str) -> dict:
        """
        Parses job descriptions into structured requirements.
        Should return a dictionary conforming to the job schema.
        """
        pass

    @abstractmethod
    async def generate_recommendation(self, candidate_data: dict, job_data: dict, match_scores: dict) -> dict:
        """
        Creates feedback based on computed scores, returning strengths, weaknesses,
        missing skills, and general recommendation.
        """
        pass

    @abstractmethod
    async def summarize_candidate(self, raw_text: str) -> str:
        """
        Creates a short 2-3 sentences summary of the candidate's experience.
        """
        pass

    @abstractmethod
    async def transcribe_image(self, image_bytes: bytes) -> str:
        """
        Transcribes the text contents of an image (OCR).
        """
        pass
