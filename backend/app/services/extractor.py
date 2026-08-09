import re
from app.config import settings
from app.services.llm.gemini_provider import GeminiProvider
from app.utils.logger import logger
from app.schemas.schemas import ResumeExtractionSchema
from pydantic import ValidationError

def get_llm_provider():
    """Factory to get the active LLM provider based on settings."""
    if settings.LLM_PROVIDER == "gemini":
        return GeminiProvider()
    else:
        logger.warning(f"Unknown LLM provider: {settings.LLM_PROVIDER}. Falling back to Gemini.")
        return GeminiProvider()

def clean_experience_years(value) -> float:
    """
    Safely extracts decimal/integer experience years from strings, ints, or floats.
    Example: '5+ years' -> 5.0, '7.5 Yrs' -> 7.5, 'five' -> 5.0
    """
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
        
    val_str = str(value).strip().lower()
    
    # Map common English number words to floats
    word_map = {
        "one": 1.0, "two": 2.0, "three": 3.0, "four": 4.0, "five": 5.0,
        "six": 6.0, "seven": 7.0, "eight": 8.0, "nine": 9.0, "ten": 10.0
    }
    
    if val_str in word_map:
        return word_map[val_str]
        
    # Search for numeric decimals/integers
    match = re.search(r'(\d+(?:\.\d+)?)', val_str)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            return 0.0
            
    return 0.0

class ExtractorService:
    def __init__(self):
        self.llm_provider = get_llm_provider()

    @staticmethod
    def extract_rule_based(text: str) -> dict:
        """
        Deterministic regex extraction for contact information.
        Supports international formats, particularly Indian formats with flexible spacing.
        """
        # Matches standard emails
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        
        # Matches: +1 (123) 456-7890 (US), +91 98765 43210 (IN), 98765-43210 (IN), 9876543210 (IN)
        phone_pattern = r'(?:(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})|(?:(?:\+?\d{1,3}[-.\s]?)?\d{5}[-.\s]?\d{5})|(?:(?:\+?\d{1,3}[-.\s]?)?\d{10})'
        
        # Matches LinkedIn profiles (in, pub, profile paths)
        linkedin_pattern = r'(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub)/[a-zA-Z0-9_-]+/?'
        
        # Matches GitHub profile links
        github_pattern = r'(?:https?://)?(?:www\.)?github\.com/[a-zA-Z0-9_-]+/?'
        
        # Match standard portfolio/general HTTP/HTTPS links
        url_pattern = r'https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?'

        emails = re.findall(email_pattern, text)
        phones = re.findall(phone_pattern, text)
        linkedins = re.findall(linkedin_pattern, text)
        githubs = re.findall(github_pattern, text)
        urls = re.findall(url_pattern, text)

        # Deduplicate, format and strip surrounding punctuation/quotes
        cleaned_emails = sorted(list(set([e.strip().lower() for e in emails])))
        
        # Clean phone numbers (filter out numbers that are too short to be phone numbers)
        cleaned_phones = []
        for p in phones:
            digits_only = re.sub(r'\D', '', p)
            # Standard phone numbers have between 10 and 13 digits (including country codes)
            if 8 <= len(digits_only) <= 15:
                cleaned_phones.append(p.strip())
        
        cleaned_linkedins = sorted(list(set([l.strip().rstrip('/') for l in linkedins])))
        cleaned_githubs = sorted(list(set([g.strip().rstrip('/') for g in githubs])))
        
        # Clean portfolio links, excluding social link captures
        portfolio_url = None
        for url in urls:
            url_clean = url.lower()
            if "linkedin.com" not in url_clean and "github.com" not in url_clean:
                # Strip trailing dots or brackets commonly captured in text dumps
                cleaned_url = url.strip().rstrip(').,;')
                portfolio_url = cleaned_url
                break

        rule_data = {
            "email": cleaned_emails[0] if cleaned_emails else None,
            "phone": cleaned_phones[0] if cleaned_phones else None,
            "linkedin": cleaned_linkedins[0] if cleaned_linkedins else None,
            "github": cleaned_githubs[0] if cleaned_githubs else None,
            "portfolio": portfolio_url
        }
        
        logger.info(f"Rule-based deterministic extraction complete: {rule_data}")
        return rule_data

    async def extract_resume(self, raw_text: str) -> dict:
        """
        Executes hybrid extraction pipeline:
        1. Run rule-based regex extraction.
        2. Enhance with LLM for complex text fields.
        3. Fallback to rule-based data if LLM is unavailable.
        """
        rule_based_data = self.extract_rule_based(raw_text)
        
        try:
            logger.info("Attempting LLM-enhanced extraction...")

            enhanced_data = await self.llm_provider.extract_resume(
                raw_text,
                rule_based_data
            )

            # Validate Gemini response against schema
            resume = ResumeExtractionSchema.model_validate(enhanced_data)

            # Merge deterministic fields
            pi = resume.personal_information

            if not pi.email:
                pi.email = rule_based_data.get("email")

            if not pi.phone:
                pi.phone = rule_based_data.get("phone")

            if not pi.linkedin:
                pi.linkedin = rule_based_data.get("linkedin")

            if not pi.github:
                pi.github = rule_based_data.get("github")

            if not pi.portfolio:
                pi.portfolio = rule_based_data.get("portfolio")

            # Normalize experience years
            resume.profession.experience_years = clean_experience_years(
                resume.profession.experience_years
            )

            return resume.model_dump()
            
        except Exception as e:
            logger.error(f"LLM extraction failed: {e}. Falling back to rule-based parser.")
            
            # Guess Candidate Name from first line of text
            lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
            candidate_name = lines[0] if lines else "Candidate"
            if len(candidate_name) > 50:
                candidate_name = "Candidate"

            # Guess skills deterministically from raw text
            tech_skills = []
            known_tech_skills = [
                "Python", "FastAPI", "SQLite", "React", "JavaScript", 
                "Node.js", "Docker", "TensorFlow", "PyTorch", "Deep Learning", 
                "C++", "C#"
            ]
            for skill in known_tech_skills:
                # If skill name contains special characters (like +, #, .), check for boundaries using character sets
                if not skill.isalnum():
                    pattern = r'(?:^|[^a-zA-Z0-9_])' + re.escape(skill) + r'(?:$|[^a-zA-Z0-9_])'
                else:
                    pattern = r'\b' + re.escape(skill) + r'\b'
                
                if re.search(pattern, raw_text, re.IGNORECASE):
                    # Keep original casing
                    tech_skills.append(skill)

            # Guess certifications deterministically
            certs = []
            known_certs = ["AWS Certified", "PMP", "Certified Scrum Master", "CompTIA", "CISSP"]
            for cert in known_certs:
                if re.search(r'\b' + re.escape(cert) + r'\b', raw_text, re.IGNORECASE):
                    certs.append({
                        "name": cert,
                        "issuer": None,
                        "issue_date": None,
                        "expiry_date": None,
                        "credential_id": None
                    })

            # Safe Fallback structure
            fallback_data = {
                "personal_information": {
                    "name": candidate_name,
                    "email": rule_based_data.get("email"),
                    "phone": rule_based_data.get("phone"),
                    "location": None,
                    "linkedin": rule_based_data.get("linkedin"),
                    "github": rule_based_data.get("github"),
                    "portfolio": rule_based_data.get("portfolio"),
                    "nationality": None
                },

                "profession": {
                    "category": "Software & IT" if tech_skills else None,
                    "subcategory": None,
                    "industry": None,
                    "current_role": None,
                    "target_roles": [],
                    "current_company": None,
                    "experience_years": 0.0,
                    "seniority": None,
                    "employment_type": None
                },

                "skills": {
                    "technical": tech_skills,
                    "soft": [],
                    "tools": [],
                    "frameworks": [],
                    "equipment": [],
                    "standards": [],
                    "languages": [],
                    "methodologies": []
                },

                "experience": [],
                "education": [],
                "projects": [],
                "certifications": certs,
                "licenses": [],
                "achievements": [],

                "summary": "Extracted using rule-based fallback.",

                "documents": {
                    "resume_available": True,
                    "cover_letter_available": False,
                    "certificates_available": False
                },

                "search_keywords": tech_skills,

                "confidence": {
                    "name": 0.5,
                    "email": 1.0 if rule_based_data.get("email") else 0.0,
                    "phone": 1.0 if rule_based_data.get("phone") else 0.0,
                    "profession": 0.2 if tech_skills else 0.0,
                    "skills": 0.5 if tech_skills else 0.0,
                    "experience": 0.0
                }
            }
            return fallback_data

    async def extract_job(self, raw_text: str) -> dict:
        """Extracts structured fields from job descriptions via LLM."""
        try:
            logger.info("Attempting job description extraction via LLM...")
            return await self.llm_provider.extract_job(raw_text)
        except Exception as e:
            logger.error(f"LLM job description extraction failed: {e}. Returning fallback template.")
            lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
            title_guess = lines[0] if lines else "Job Position"
            if len(title_guess) > 60:
                title_guess = "Job Position"
                
            return {
                "title": title_guess,
                "skills": [],
                "experience": "Not specified",
                "education": "Not specified",
                "responsibilities": [],
                "preferred_skills": [],
                "location": "Not specified"
            }
