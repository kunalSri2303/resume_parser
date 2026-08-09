import json
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import delete
from app.database.models import Candidate, Skill, SkillAlias, CandidateSkill, EmbeddingMetadata, Job, Recommendation, RecruiterFeedback, User
from app.services.skill_normalizer import SkillNormalizer
from app.utils.logger import logger

# Global Skill Normalizer instance for database operations
normalizer = SkillNormalizer()

def get_or_create_skill(db: Session, skill_name: str) -> Skill:
    """
    Finds a canonical Skill by checking names and aliases.
    If none is found, creates a new canonical Skill and registers the alias.
    Flushes changes to populate IDs without committing the parent transaction prematurely.
    """
    cleaned_name = skill_name.strip().lower()
    
    # 1. Check if the alias already exists
    alias_record = db.query(SkillAlias).filter(SkillAlias.alias == cleaned_name).first()
    if alias_record:
        return alias_record.skill
        
    # 2. Check if a canonical skill with this name already exists (case-insensitive)
    normalized_canonical = normalizer.normalize_skill(skill_name)
    skill_record = db.query(Skill).filter(Skill.name == normalized_canonical).first()
    if skill_record:
        # Register alias for future fast lookup
        new_alias = SkillAlias(alias=cleaned_name, skill_id=skill_record.id)
        db.add(new_alias)
        db.flush()
        return skill_record
        
    # 3. Create a new Skill and alias
    logger.info(f"Adding new canonical skill to database: '{normalized_canonical}' (alias: '{cleaned_name}')")
    new_skill = Skill(name=normalized_canonical)
    db.add(new_skill)
    db.flush()  # Populate ID
    
    new_alias = SkillAlias(alias=cleaned_name, skill_id=new_skill.id)
    db.add(new_alias)
    db.flush()
    
    return new_skill

def save_or_update_candidate(db: Session, candidate_data: dict, resume_path: str, raw_text: str) -> tuple[Candidate, bool]:
    """
    Saves candidate details. If email already exists, updates candidate profile.
    Uses atomic transaction blocks with automatic rollback on error.
    Returns (Candidate, is_updated).
    """
    pi = candidate_data.get("personal_information") or {}
    profession = candidate_data.get("profession") or {}
    skills_data = candidate_data.get("skills") or {}

    email = pi.get("email") or candidate_data.get("email")
    if not email:
        raise ValueError("Candidate email is required for database indexing.")
        
    is_updated = False
    
    # Extract fields with safe fallbacks
    name = pi.get("name") or candidate_data.get("name")
    phone = pi.get("phone") or candidate_data.get("phone")
    location = pi.get("location") or candidate_data.get("location")
    experience_years = float(profession.get("experience_years") or candidate_data.get("experience_years") or 0.0)
    current_company = profession.get("current_company") or candidate_data.get("current_company")
    role = profession.get("current_role") or candidate_data.get("role")

    # Format sub-structures to JSON strings
    experience_str = json.dumps(candidate_data.get("experience") or [])
    education_str = json.dumps(candidate_data.get("education") or [])
    projects_str = json.dumps(candidate_data.get("projects") or [])
    certifications_str = json.dumps(candidate_data.get("certifications") or [])
    languages_str = json.dumps(skills_data.get("languages") or candidate_data.get("languages") or [])
    
    try:
        existing_candidate = db.query(Candidate).filter(Candidate.email == email).first()
        
        if existing_candidate:
            logger.info(f"Candidate email {email} exists. Updating candidate record (ID: {existing_candidate.id}).")
            is_updated = True
            
            # Clear existing skills relationships to prevent stale links
            db.query(CandidateSkill).filter(CandidateSkill.candidate_id == existing_candidate.id).delete()
            
            # Update columns
            existing_candidate.name = name or existing_candidate.name
            existing_candidate.phone = phone or existing_candidate.phone
            existing_candidate.location = location or existing_candidate.location
            existing_candidate.experience_years = experience_years
            existing_candidate.current_company = current_company or existing_candidate.current_company
            existing_candidate.role = role or existing_candidate.role
            
            existing_candidate.notice_period = candidate_data.get("notice_period", existing_candidate.notice_period)
            existing_candidate.expected_salary = candidate_data.get("expected_salary", existing_candidate.expected_salary)
            existing_candidate.preferred_location = candidate_data.get("preferred_location", existing_candidate.preferred_location)
            existing_candidate.resume_path = resume_path
            existing_candidate.personal_information = json.dumps(pi)
            existing_candidate.experience = experience_str
            existing_candidate.education = education_str
            existing_candidate.projects = projects_str
            existing_candidate.certifications = certifications_str
            existing_candidate.languages = languages_str
            existing_candidate.raw_text = raw_text
            existing_candidate.summary = candidate_data.get("summary", existing_candidate.summary)
            existing_candidate.profession = json.dumps(profession)
            existing_candidate.categorized_skills = json.dumps(skills_data)
            existing_candidate.search_keywords = json.dumps(candidate_data.get("search_keywords", []))
            existing_candidate.achievements = json.dumps(candidate_data.get("achievements", []))
            existing_candidate.licenses = json.dumps(candidate_data.get("licenses", []))
            existing_candidate.documents = json.dumps(candidate_data.get("documents", {}))
            existing_candidate.confidence = json.dumps(candidate_data.get("confidence", {}))
            existing_candidate.upload_date = datetime.utcnow()
            
            # Flush changes to DB
            db.flush()
            
            candidate = existing_candidate
        else:
            logger.info(f"Creating new candidate record for {email}.")
            candidate = Candidate(
                name=name,
                email=email,
                phone=phone,
                location=location,
                experience_years=experience_years,
                current_company=current_company,
                role=role,
                notice_period=candidate_data.get("notice_period"),
                expected_salary=candidate_data.get("expected_salary"),
                preferred_location=candidate_data.get("preferred_location"),
                resume_path=resume_path,
                personal_information=json.dumps(pi),
                experience=experience_str,
                education=education_str,
                projects=projects_str,
                certifications=certifications_str,
                languages=languages_str,
                raw_text=raw_text,
                profession=json.dumps(profession),
                categorized_skills=json.dumps(skills_data),
                search_keywords=json.dumps(candidate_data.get("search_keywords", [])),
                achievements=json.dumps(candidate_data.get("achievements", [])),
                licenses=json.dumps(candidate_data.get("licenses", [])),
                documents=json.dumps(candidate_data.get("documents", {})),
                confidence=json.dumps(candidate_data.get("confidence", {})),
                summary=candidate_data.get("summary")
            )
            db.add(candidate)
            
        db.flush()  # Populate candidate ID if new

        # Link Skills (canonicalized)
        all_skills = []
        for category in [
            "technical",
            "soft",
            "tools",
            "frameworks",
            "equipment",
            "standards",
            "languages",
            "methodologies",
        ]:
            all_skills.extend(skills_data.get(category) or [])

        # Fallback to flat list of skills if empty
        if not all_skills and isinstance(candidate_data.get("skills"), list):
            all_skills = candidate_data.get("skills")

        # Remove duplicates while preserving order
        all_skills = list(dict.fromkeys(all_skills))

        for skill_name in all_skills:
            if not skill_name:
                continue

            skill = get_or_create_skill(db, skill_name)

            assoc = CandidateSkill(
                candidate_id=candidate.id,
                skill_id=skill.id,
                confidence_score=1.0,
                years_of_experience=None,
            )

            db.add(assoc)
            
        db.commit()
        db.refresh(candidate)
        return candidate, is_updated
    except Exception as e:
        db.rollback()
        logger.error(f"Database transaction failed while saving candidate {email}: {e}")
        raise e

def save_job(db: Session, job_data: dict, raw_text: str = "") -> Job:
    """Saves a Job Description to the database with transaction protection."""
    try:
        job = Job(
            title=job_data.get("title", "Job Position"),
            location=job_data.get("location"),
            experience=job_data.get("experience"),
            education=job_data.get("education"),
            interview_date=job_data.get("interview_date"),
            skills=json.dumps(job_data.get("skills", []) if isinstance(job_data.get("skills"), list) else []),
            preferred_skills=json.dumps(job_data.get("preferred_skills", []) if isinstance(job_data.get("preferred_skills"), list) else []),
            responsibilities=json.dumps(job_data.get("responsibilities", []) if isinstance(job_data.get("responsibilities"), list) else []),
            raw_text=raw_text
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        logger.info(f"Saved job description: '{job.title}' (ID: {job.id})")
        return job
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save job details: {e}")
        raise e

def update_job(db: Session, job_id: int, job_data: dict) -> Job:
    """Updates an existing Job Description in the database with transaction protection."""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return None
        if "title" in job_data and job_data["title"] is not None:
            job.title = job_data["title"]
        if "location" in job_data:
            job.location = job_data["location"]
        if "experience" in job_data:
            job.experience = job_data["experience"]
        if "education" in job_data:
            job.education = job_data["education"]
        if "interview_date" in job_data:
            job.interview_date = job_data["interview_date"]
        if "skills" in job_data and job_data["skills"] is not None:
            job.skills = json.dumps(job_data["skills"] if isinstance(job_data["skills"], list) else [])
        if "preferred_skills" in job_data and job_data["preferred_skills"] is not None:
            job.preferred_skills = json.dumps(job_data["preferred_skills"] if isinstance(job_data["preferred_skills"], list) else [])
        if "responsibilities" in job_data and job_data["responsibilities"] is not None:
            job.responsibilities = json.dumps(job_data["responsibilities"] if isinstance(job_data["responsibilities"], list) else [])
        db.commit()
        db.refresh(job)
        logger.info(f"Updated job description: '{job.title}' (ID: {job.id})")
        return job
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update job details: {e}")
        raise e

def delete_candidate_embedding_metadata(db: Session, candidate_id: int):
    """Deletes existing embedding metadata mappings for a candidate with transaction protection."""
    try:
        db.query(EmbeddingMetadata).filter(
            EmbeddingMetadata.entity_type == "candidate",
            EmbeddingMetadata.entity_id == candidate_id
        ).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete embedding metadata for candidate {candidate_id}: {e}")
        raise e

def save_embedding_metadata(db: Session, entity_type: str, entity_id: int, section_type: str, faiss_id: int):
    """Saves metadata map between FAISS ID and SQLite entities with transaction protection."""
    try:
        meta = EmbeddingMetadata(
            entity_type=entity_type,
            entity_id=entity_id,
            section_type=section_type,
            faiss_index_id=faiss_id
        )
        db.merge(meta)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save embedding metadata for {entity_type} {entity_id}: {e}")
        raise e

def save_recruiter_feedback(db: Session, candidate_id: int, job_id: int, status: str, feedback: str) -> RecruiterFeedback:
    """Saves feedback from recruiter regarding a match quality with transaction protection."""
    try:
        fb = RecruiterFeedback(
            candidate_id=candidate_id,
            job_id=job_id,
            status=status,
            feedback=feedback
        )
        db.add(fb)
        db.commit()
        db.refresh(fb)
        logger.info(f"Saved recruiter feedback for candidate {candidate_id} on job {job_id}.")
        return fb
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save recruiter feedback for candidate {candidate_id}: {e}")
        raise e

def save_recommendation(db: Session, candidate_id: int, job_id: int, rec_data: dict, match_score: float) -> Recommendation:
    """Saves recommendation report details and match scores with transaction protection."""
    try:
        # Remove older recommendations if any
        db.query(Recommendation).filter(
            Recommendation.candidate_id == candidate_id,
            Recommendation.job_id == job_id
        ).delete()
        
        rec = Recommendation(
            candidate_id=candidate_id,
            job_id=job_id,
            strengths=json.dumps(rec_data.get("strengths", [])),
            weaknesses=json.dumps(rec_data.get("weaknesses", [])),
            missing_skills=json.dumps(rec_data.get("missing_skills", [])),
            recommendation_text=rec_data.get("recommendation_text", ""),
            interview_ready=rec_data.get("interview_ready", False),
            match_score=match_score
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return rec
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save recommendations for candidate {candidate_id}: {e}")
        raise e

# User Authentication Database Operations
def get_user_by_username(db: Session, username: str) -> User:
    """Finds a User by username (case-insensitive)."""
    return db.query(User).filter(User.username == username.strip().lower()).first()

def create_user(db: Session, username: str, password_hash: str, role: str) -> User:
    """Creates a new User in database."""
    try:
        user = User(
            username=username.strip().lower(),
            password_hash=password_hash,
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Created user: '{user.username}' with role '{user.role}'")
        return user
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create user {username}: {e}")
        raise e

def update_user_password(db: Session, username: str, new_password_hash: str) -> User:
    """Updates password hash for a user."""
    try:
        user = get_user_by_username(db, username)
        if not user:
            return None
        user.password_hash = new_password_hash
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        logger.info(f"Successfully updated password hash for user: '{username}'")
        return user
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update password for user {username}: {e}")
        raise e

def get_all_users(db: Session):
    """Retrieves all registered users."""
    return db.query(User).all()

