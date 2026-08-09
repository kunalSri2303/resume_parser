import json
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Job
from app.database.operations import save_job, update_job
from app.schemas.schemas import JobResponseSchema, JobCreateSchema, JobUpdateSchema
from app.services.parser import ParserService
from app.services.extractor import ExtractorService
from app.utils.logger import logger

router = APIRouter(prefix="", tags=["Jobs"])
extractor = ExtractorService()

def format_job_response(job: Job) -> dict:
    """Formats SQLAlchemy Job model to match the JobResponseSchema."""
    return {
        "id": job.id,
        "title": job.title,
        "location": job.location,
        "experience": job.experience,
        "education": job.education,
        "interview_date": job.interview_date,
        "skills": json.loads(job.skills or "[]"),
        "preferred_skills": json.loads(job.preferred_skills or "[]"),
        "responsibilities": json.loads(job.responsibilities or "[]"),
        "upload_date": job.upload_date
    }

@router.post("/upload-job", response_model=JobResponseSchema)
async def upload_job(
    file: UploadFile = File(None),
    raw_text: str = Form(None),
    interview_date: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Uploads a job description.
    Supports either uploading a PDF/DOCX file OR submitting plain text.
    Uses LLM to extract structured fields and saves the job.
    """
    job_text = ""
    
    if file:
        filename = file.filename
        suffix = Path(filename).suffix.lower()
        if suffix not in [".pdf", ".docx"]:
            raise HTTPException(status_code=400, detail="Unsupported file format. Only PDF and DOCX are supported.")
        
        try:
            content = await file.read()
            job_text = ParserService.parse_file(content, filename)
            logger.info(f"Successfully parsed job description file: {filename}")
        except Exception as e:
            logger.error(f"Failed to parse job description file: {e}")
            raise HTTPException(status_code=500, detail=f"Error parsing job description file: {e}")
            
    elif raw_text and raw_text.strip():
        job_text = raw_text.strip()
        logger.info("Using raw text input for job description.")
        
    else:
        raise HTTPException(
            status_code=400,
            detail="Please provide a job description file (PDF/DOCX) or plain text."
        )

    # Call LLM to extract job fields
    try:
        extracted_job_data = await extractor.extract_job(job_text)
    except Exception as e:
        logger.error(f"LLM job extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"LLM extraction error: {e}")

    if interview_date and interview_date.strip():
        extracted_job_data["interview_date"] = interview_date.strip()

    # Save to SQLite database
    saved_job = save_job(db, extracted_job_data, job_text)
    return format_job_response(saved_job)

@router.post("/job", response_model=JobResponseSchema)
def create_job(job_in: JobCreateSchema, db: Session = Depends(get_db)):
    """Creates a job position vacancy directly from structured JSON data."""
    job_data = job_in.model_dump()
    saved_job = save_job(db, job_data)
    return format_job_response(saved_job)

@router.put("/job/{id}", response_model=JobResponseSchema)
def update_job_endpoint(id: int, job_in: JobUpdateSchema, db: Session = Depends(get_db)):
    """Updates an existing job position vacancy details."""
    job_data = job_in.model_dump(exclude_unset=True)
    updated_job = update_job(db, id, job_data)
    if not updated_job:
        raise HTTPException(status_code=404, detail="Job position not found.")
    return format_job_response(updated_job)

@router.get("/jobs", response_model=list[JobResponseSchema])
def get_jobs(db: Session = Depends(get_db)):
    """Retrieves all job descriptions."""
    jobs = db.query(Job).order_by(Job.upload_date.desc()).all()
    return [format_job_response(j) for j in jobs]

@router.get("/job/{id}", response_model=JobResponseSchema)
def get_job(id: int, db: Session = Depends(get_db)):
    """Retrieves details of a specific job description."""
    job = db.query(Job).filter(Job.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found.")
    return format_job_response(job)
