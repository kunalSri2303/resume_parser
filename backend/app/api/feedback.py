from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.operations import save_recruiter_feedback
from app.schemas.schemas import RecruiterFeedbackCreateSchema, RecruiterFeedbackResponseSchema
from app.utils.logger import logger

router = APIRouter(prefix="", tags=["Feedback"])

@router.post("/feedback", response_model=RecruiterFeedbackResponseSchema)
def submit_recruiter_feedback(
    feedback_payload: RecruiterFeedbackCreateSchema,
    db: Session = Depends(get_db)
):
    """
    Submits recruiter feedback on candidate suitability for a job.
    Options: 'Hired', 'Rejected', 'Shortlisted'
    """
    status = feedback_payload.status
    if status not in ["Hired", "Rejected", "Shortlisted"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Must be one of: 'Hired', 'Rejected', 'Shortlisted'."
        )

    logger.info(f"Submitting recruiter feedback: Candidate {feedback_payload.candidate_id}, Job {feedback_payload.job_id}, Status {status}")
    try:
        fb_record = save_recruiter_feedback(
            db=db,
            candidate_id=feedback_payload.candidate_id,
            job_id=feedback_payload.job_id,
            status=status,
            feedback=feedback_payload.feedback
        )
        return fb_record
    except Exception as e:
        logger.error(f"Failed to save recruiter feedback: {e}")
        raise HTTPException(status_code=500, detail="Database write error saving feedback.")
