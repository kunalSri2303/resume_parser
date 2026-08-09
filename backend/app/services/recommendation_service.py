import json
from sqlalchemy.orm import Session
from app.database.models import Candidate, Job, Recommendation
from app.database.operations import save_recommendation
from app.services.llm.base_provider import LLMProvider
from app.services.matching_service import MatchingService
from app.utils.logger import logger

class RecommendationService:
    def __init__(self, llm_provider: LLMProvider, matching_service: MatchingService):
        self.llm_provider = llm_provider
        self.matching_service = matching_service

    async def get_or_create_recommendation(self, db: Session, candidate_id: int, job_id: int) -> dict:
        """
        Retrieves existing recommendation, or calculates scores and calls LLM to generate one.
        Saves new recommendations to database.
        """
        # Check if recommendation already exists in db
        existing_rec = db.query(Recommendation).filter(
            Recommendation.candidate_id == candidate_id,
            Recommendation.job_id == job_id
        ).first()

        if existing_rec:
            logger.info(f"Retrieving existing recommendation for candidate {candidate_id} on job {job_id}")
            return {
                "candidate_id": candidate_id,
                "job_id": job_id,
                "strengths": json.loads(existing_rec.strengths or "[]"),
                "weaknesses": json.loads(existing_rec.weaknesses or "[]"),
                "missing_skills": json.loads(existing_rec.missing_skills or "[]"),
                "recommendation_text": existing_rec.recommendation_text,
                "interview_ready": existing_rec.interview_ready,
                "match_score": existing_rec.match_score
            }

        # Otherwise, generate new recommendation
        logger.info(f"Generating new recommendation for candidate {candidate_id} on job {job_id}")
        
        # 1. Fetch Candidate and Job details
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        job = db.query(Job).filter(Job.id == job_id).first()

        if not candidate or not job:
            raise ValueError(f"Candidate (ID: {candidate_id}) or Job (ID: {job_id}) not found.")

        # Deserialize candidate structures to match the nested ResumeExtractionSchema
        candidate_data = {
            "personal_information": json.loads(candidate.personal_information or "{}") or {
                "name": candidate.name,
                "email": candidate.email,
                "phone": candidate.phone,
                "location": candidate.location,
                "linkedin": None,
                "github": None,
                "portfolio": None,
                "nationality": None
            },
            "profession": json.loads(candidate.profession or "{}") or {
                "category": None,
                "subcategory": None,
                "industry": None,
                "current_role": candidate.role,
                "target_roles": [],
                "current_company": candidate.current_company,
                "experience_years": candidate.experience_years,
                "seniority": None,
                "employment_type": None
            },
            "skills": json.loads(candidate.categorized_skills or "{}") or {
                "technical": [cs.skill.name for cs in candidate.skills],
                "soft": [],
                "tools": [],
                "frameworks": [],
                "equipment": [],
                "standards": [],
                "languages": json.loads(candidate.languages or "[]"),
                "methodologies": []
            },
            "experience": json.loads(candidate.experience or "[]"),
            "education": json.loads(candidate.education or "[]"),
            "projects": json.loads(candidate.projects or "[]"),
            "certifications": json.loads(candidate.certifications or "[]"),
            "licenses": json.loads(candidate.licenses or "[]"),
            "achievements": json.loads(candidate.achievements or "[]"),
            "summary": candidate.summary,
            "documents": json.loads(candidate.documents or "{}"),
            "confidence": json.loads(candidate.confidence or "{}"),
            "search_keywords": json.loads(candidate.search_keywords or "[]")
        }

        # Deserialize job structures
        job_data = {
            "title": job.title,
            "location": job.location,
            "experience": job.experience,
            "education": job.education,
            "skills": json.loads(job.skills or "[]"),
            "preferred_skills": json.loads(job.preferred_skills or "[]"),
            "responsibilities": json.loads(job.responsibilities or "[]")
        }

        # 2. Compute matching scores
        # We can extract the candidate's scores from the full ranking list for the job
        matches = self.matching_service.match_job(db, job, top_k=1000)
        
        cand_match = None
        for m in matches:
            if m["candidate_id"] == candidate_id:
                cand_match = m
                break
                
        if not cand_match:
            # Candidate has no vectors in index, mock default scores
            cand_match = {
                "overall_score": 0.0,
                "section_scores": {"skills": 0.0, "experience": 0.0, "projects": 0.0, "education": 0.0, "summary": 0.0}
            }

        scores = {
            "overall_score": cand_match["overall_score"],
            "section_scores": cand_match["section_scores"]
        }

        # 3. Call LLM to generate recommendation explaining the pre-calculated score
        try:
            rec_json = await self.llm_provider.generate_recommendation(candidate_data, job_data, scores)
        except Exception as e:
            logger.error(f"Failed to generate LLM recommendation: {e}. Returning fallback recommendation.")
            # Fallback recommendation report
            rec_json = {
                "strengths": ["Match score calculation complete"],
                "weaknesses": ["Unable to run AI analysis at this time"],
                "missing_skills": [],
                "recommendation_text": f"Candidate matches job with overall similarity score of {scores['overall_score']}%.",
                "interview_ready": scores["overall_score"] >= 65.0
            }

        # 4. Save to database
        saved_rec = save_recommendation(db, candidate_id, job_id, rec_json, scores["overall_score"])
        
        return {
            "candidate_id": candidate_id,
            "job_id": job_id,
            "strengths": rec_json.get("strengths", []),
            "weaknesses": rec_json.get("weaknesses", []),
            "missing_skills": rec_json.get("missing_skills", []),
            "recommendation_text": rec_json.get("recommendation_text", ""),
            "interview_ready": rec_json.get("interview_ready", False),
            "match_score": saved_rec.match_score
        }
