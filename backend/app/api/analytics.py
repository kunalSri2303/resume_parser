from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.database import get_db
from app.database.models import Candidate, Job, CandidateSkill, Skill, RecruiterFeedback
from app.utils.logger import logger

router = APIRouter(prefix="", tags=["Analytics"])

@router.get("/analytics")
def get_platform_analytics(db: Session = Depends(get_db)):
    """
    Computes platform dashboard metrics:
    - Total Candidates and Jobs
    - Average Experience (Years)
    - Skill Distribution (Canonical skills frequency)
    - Hiring Funnel (Status counts from recruiter feedback)
    - Candidate Locations (Top cities/regions)
    - Experience Distribution (Binned ranges)
    - Resume Upload Trends (Timeline aggregations)
    """
    logger.info("Computing platform analytics metrics.")

    # 1. Total Candidates and Jobs
    total_candidates = db.query(func.count(Candidate.id)).scalar() or 0
    total_jobs = db.query(func.count(Job.id)).scalar() or 0

    # 2. Average Experience
    avg_exp = db.query(func.avg(Candidate.experience_years)).scalar()
    average_experience = round(float(avg_exp), 1) if avg_exp is not None else 0.0

    # 3. Skill Distribution (Top 10)
    skill_counts = (
        db.query(Skill.name, func.count(CandidateSkill.candidate_id).label("count"))
        .join(CandidateSkill, Skill.id == CandidateSkill.skill_id)
        .group_by(Skill.name)
        .order_by(func.count(CandidateSkill.candidate_id).desc())
        .limit(10)
        .all()
    )
    skill_distribution = {name: count for name, count in skill_counts}

    # 4. Hiring Funnel Status
    funnel_counts = (
        db.query(RecruiterFeedback.status, func.count(RecruiterFeedback.id))
        .group_by(RecruiterFeedback.status)
        .all()
    )
    hiring_funnel = {"Shortlisted": 0, "Rejected": 0, "Hired": 0}
    for status, count in funnel_counts:
        hiring_funnel[status] = count

    # 5. Candidate Locations (Top 5)
    location_counts = (
        db.query(Candidate.location, func.count(Candidate.id))
        .filter(Candidate.location.isnot(None))
        .group_by(Candidate.location)
        .order_by(func.count(Candidate.id).desc())
        .limit(5)
        .all()
    )
    candidate_locations = {loc: count for loc, count in location_counts}

    # 6. Experience Distribution
    exp_bins = {"Entry (0-2 yrs)": 0, "Mid (2-5 yrs)": 0, "Senior (5-10 yrs)": 0, "Lead (10+ yrs)": 0}
    candidates_exp = db.query(Candidate.experience_years).all()
    for (exp,) in candidates_exp:
        if exp is None:
            exp = 0.0
        if exp <= 2.0:
            exp_bins["Entry (0-2 yrs)"] += 1
        elif exp <= 5.0:
            exp_bins["Mid (2-5 yrs)"] += 1
        elif exp <= 10.0:
            exp_bins["Senior (5-10 yrs)"] += 1
        else:
            exp_bins["Lead (10+ yrs)"] += 1

    # 7. Upload Trends (Last 7 days)
    # Group by date formatted string
    trends = (
        db.query(
            func.strftime("%Y-%m-%d", Candidate.upload_date).label("date"),
            func.count(Candidate.id).label("count")
        )
        .group_by("date")
        .order_by("date")
        .limit(10)
        .all()
    )
    resume_upload_trends = {date: count for date, count in trends}

    return {
        "total_candidates": total_candidates,
        "total_jobs": total_jobs,
        "average_experience": average_experience,
        "skill_distribution": skill_distribution,
        "hiring_funnel": hiring_funnel,
        "candidate_locations": candidate_locations,
        "experience_distribution": exp_bins,
        "resume_upload_trends": resume_upload_trends
    }
