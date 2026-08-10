import json
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Candidate
from app.schemas.schemas import CandidateResponseSchema
from app.services.storage.local_storage import LocalStorage
from app.services.parser import ParserService
from app.services.pipeline_service import PipelineService
from app.utils.logger import logger

router = APIRouter(prefix="", tags=["Resumes"])

storage = LocalStorage()

def get_pipeline_service():
    return PipelineService()

def format_candidate_response(candidate: Candidate) -> dict:
    """Formats SQLAlchemy candidate model to match the CandidateResponseSchema."""
    # Deserialize nested JSON fields with robust structure fallbacks
    try:
        pi = json.loads(candidate.personal_information or "{}")
    except Exception:
        pi = {}
    if not pi:
        pi = {
            "name": candidate.name,
            "email": candidate.email,
            "phone": candidate.phone,
            "location": candidate.location,
            "linkedin": None,
            "github": None,
            "portfolio": None,
            "nationality": None
        }

    try:
        prof = json.loads(candidate.profession or "{}")
    except Exception:
        prof = {}
    if not prof:
        prof = {
            "category": None,
            "subcategory": None,
            "industry": None,
            "current_role": candidate.role,
            "target_roles": [],
            "current_company": candidate.current_company,
            "experience_years": candidate.experience_years,
            "seniority": None,
            "employment_type": None
        }

    try:
        skills_nested = json.loads(candidate.categorized_skills or "{}")
    except Exception:
        skills_nested = {}
    if not skills_nested:
        skills_nested = {
            "technical": [cs.skill.name for cs in candidate.skills],
            "soft": [],
            "tools": [],
            "frameworks": [],
            "equipment": [],
            "standards": [],
            "languages": json.loads(candidate.languages or "[]"),
            "methodologies": []
        }

    try:
        certs_raw = json.loads(candidate.certifications or "[]")
    except Exception:
        certs_raw = []
    certs_flat = []
    certs_nested_list = []
    for c in certs_raw:
        if isinstance(c, dict):
            certs_nested_list.append(c)
            if c.get("name"):
                certs_flat.append(c["name"])
        elif isinstance(c, str):
            certs_flat.append(c)
            certs_nested_list.append({
                "name": c,
                "issuer": None,
                "issue_date": None,
                "expiry_date": None,
                "credential_id": None
            })

    try:
        licenses_list = json.loads(candidate.licenses or "[]")
    except Exception:
        licenses_list = []

    try:
        achievements_list = json.loads(candidate.achievements or "[]")
    except Exception:
        achievements_list = []

    try:
        documents_dict = json.loads(candidate.documents or "{}")
    except Exception:
        documents_dict = {
            "resume_available": True,
            "cover_letter_available": False,
            "certificates_available": False
        }

    try:
        confidence_dict = json.loads(candidate.confidence or "{}")
    except Exception:
        confidence_dict = {}

    try:
        search_keywords_list = json.loads(candidate.search_keywords or "[]")
    except Exception:
        search_keywords_list = []

    return {
        "id": candidate.id,
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "location": candidate.location,
        "experience_years": candidate.experience_years,
        "current_company": candidate.current_company,
        "role": candidate.role,
        "notice_period": candidate.notice_period,
        "expected_salary": candidate.expected_salary,
        "preferred_location": candidate.preferred_location,
        "resume_path": candidate.resume_path,
        "summary": candidate.summary,
        "upload_date": candidate.upload_date,
        "skills": [
            {
                "skill": {"id": cs.skill.id, "name": cs.skill.name},
                "confidence_score": cs.confidence_score,
                "years_of_experience": cs.years_of_experience
            }
            for cs in candidate.skills
        ],
        "education": json.loads(candidate.education or "[]"),
        "experience": json.loads(candidate.experience or "[]"),
        "projects": json.loads(candidate.projects or "[]"),
        "certifications": certs_flat,
        "languages": json.loads(candidate.languages or "[]"),
        
        # New nested schema fields
        "personal_information": pi,
        "profession": prof,
        "categorized_skills": skills_nested,
        "certifications_nested": certs_nested_list,
        "licenses": licenses_list,
        "achievements": achievements_list,
        "documents": documents_dict,
        "search_keywords": search_keywords_list,
        "confidence": confidence_dict,

        "recommendations": [
            {
                "id": r.id,
                "job_id": r.job_id,
                "match_score": r.match_score,
                "interview_ready": r.interview_ready,
                "recommendation_text": r.recommendation_text,
                "strengths": json.loads(r.strengths or "[]"),
                "weaknesses": json.loads(r.weaknesses or "[]"),
                "missing_skills": json.loads(r.missing_skills or "[]")
            } for r in (candidate.recommendations or [])
        ],
        "feedbacks": [
            {
                "id": f.id,
                "job_id": f.job_id,
                "status": f.status,
                "feedback": f.feedback,
                "timestamp": f.timestamp.isoformat() if f.timestamp else None
            } for f in (candidate.feedbacks or [])
        ]
    }

@router.post("/upload-resume")
async def upload_resumes(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Uploads single or multiple resumes (PDF, DOCX, ZIP).
    Saves them locally, returns success immediately, and processes them in background.
    """
    logger.info(f"Received upload request for {len(files)} items.")
    processed_files = []
    skipped_files = []

    for file in files:
        filename = file.filename
        suffix = Path(filename).suffix.lower()
        
        try:
            content = await file.read()
            pipeline_svc = get_pipeline_service()
            
            # Handle ZIP uploads
            if suffix == ".zip":
                extracted = ParserService.extract_zip(content)
                del content
                for ext_filename, ext_bytes in extracted:
                    # Save each extracted file to storage
                    unique_name = f"{uuid.uuid4().hex}_{ext_filename}"
                    file_path = storage.save_file(ext_bytes, unique_name)
                    del ext_bytes
                    
                    # Queue background processing
                    background_tasks.add_task(pipeline_svc.process_resume, file_path, ext_filename)
                    processed_files.append(ext_filename)
                del extracted
            
            # Handle PDF/DOCX uploads
            elif suffix in [".pdf", ".docx"]:
                unique_name = f"{uuid.uuid4().hex}_{filename}"
                file_path = storage.save_file(content, unique_name)
                del content
                
                # Queue background processing
                background_tasks.add_task(pipeline_svc.process_resume, file_path, filename)
                processed_files.append(filename)
                
            else:
                logger.warning(f"Unsupported file format skipped: {filename}")
                skipped_files.append(filename)
                
        except Exception as e:
            logger.error(f"Error preparing file {filename} for upload: {e}")
            skipped_files.append(filename)
        finally:
            import gc
            gc.collect()

    if not processed_files:
        raise HTTPException(
            status_code=400,
            detail=f"No supported files were processed. Supported formats: .pdf, .docx, .zip. Skipped: {skipped_files}"
        )

    return {
        "status": "success",
        "message": f"Successfully queued {len(processed_files)} resumes for background extraction.",
        "processed_files": processed_files,
        "skipped_files": skipped_files
    }

@router.get("/candidates", response_model=list[CandidateResponseSchema])
def get_candidates(db: Session = Depends(get_db)):
    """Retrieves all candidates from the database."""
    candidates = db.query(Candidate).order_by(Candidate.upload_date.desc()).all()
    return [format_candidate_response(c) for c in candidates]

@router.get("/candidate/{id}", response_model=CandidateResponseSchema)
def get_candidate(id: int, db: Session = Depends(get_db)):
    """Retrieves details of a specific candidate."""
    candidate = db.query(Candidate).filter(Candidate.id == id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return format_candidate_response(candidate)
