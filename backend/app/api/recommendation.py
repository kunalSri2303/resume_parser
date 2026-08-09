from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Job
from app.schemas.schemas import MatchResultSchema, RecommendationResponseSchema
from app.services.embedding.sentence_transformer import SentenceTransformersProvider
from app.services.vector_store import VectorStoreService
from app.services.matching_service import MatchingService
from app.services.recommendation_service import RecommendationService
from app.services.llm.gemini_provider import GeminiProvider
from app.utils.logger import logger

router = APIRouter(prefix="", tags=["Recommendations"])

def get_matching_service():
    return MatchingService(SentenceTransformersProvider(), VectorStoreService())

def get_recommendation_service():
    return RecommendationService(GeminiProvider(), get_matching_service())

@router.post("/match/{job_id}", response_model=list[MatchResultSchema])
def match_candidates_for_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    """
    Triggers the weighted scoring engine to match candidates against a job description.
    Returns ranked candidates list sorted by overall score.
    """
    logger.info(f"Triggering candidate-job matching for Job ID: {job_id}")
    matching_service = get_matching_service()
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found.")

    matches = matching_service.match_job(db, job)
    return matches

@router.get("/recommendation/{candidate_id}/{job_id}", response_model=RecommendationResponseSchema)
async def get_candidate_recommendation(
    candidate_id: int,
    job_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieves or generates the LLM-enhanced recommendation feedback report
    comparing the candidate's profile to the job description.
    """
    logger.info(f"Fetching AI recommendation report for Candidate {candidate_id} on Job {job_id}")
    try:
        recommendation_service = get_recommendation_service()
        recommendation = await recommendation_service.get_or_create_recommendation(db, candidate_id, job_id)
        return recommendation
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Error fetching candidate recommendation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error generating recommendation.")
