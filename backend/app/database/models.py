from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    experience_years = Column(Float, default=0.0)
    current_company = Column(String, nullable=True)
    role = Column(String, nullable=True)
    notice_period = Column(String, nullable=True)
    expected_salary = Column(String, nullable=True)
    preferred_location = Column(String, nullable=True)
    resume_path = Column(String, nullable=True)
    
    # Store complex structures as JSON strings for simplicity and portability
    personal_information = Column(Text, default="{}")
    experience = Column(Text, default="[]")
    education = Column(Text, default="[]")
    projects = Column(Text, default="[]")
    certifications = Column(Text, default="[]")
    languages = Column(Text, default="[]")

    profession = Column(Text, default="{}")
    categorized_skills = Column(Text, default="{}")
    search_keywords = Column(Text, default="[]")
    achievements = Column(Text, default="[]")
    licenses = Column(Text, default="[]")
    documents = Column(Text, default="{}")
    confidence = Column(Text, default="{}")
    raw_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    upload_date = Column(DateTime, default=datetime.utcnow)

    # Relationships
    skills = relationship("CandidateSkill", back_populates="candidate", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="candidate", cascade="all, delete-orphan")
    feedbacks = relationship("RecruiterFeedback", back_populates="candidate", cascade="all, delete-orphan")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    location = Column(String, nullable=True)
    experience = Column(String, nullable=True)
    education = Column(String, nullable=True)
    
    # Store arrays as JSON/comma-separated strings
    skills = Column(Text, default="[]")
    preferred_skills = Column(Text, default="[]")
    responsibilities = Column(Text, default="[]")
    
    raw_text = Column(Text, nullable=True)
    upload_date = Column(DateTime, default=datetime.utcnow)

    # Relationships
    recommendations = relationship("Recommendation", back_populates="job", cascade="all, delete-orphan")
    feedbacks = relationship("RecruiterFeedback", back_populates="job", cascade="all, delete-orphan")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    # Relationships
    aliases = relationship("SkillAlias", back_populates="skill", cascade="all, delete-orphan")
    candidates = relationship("CandidateSkill", back_populates="skill", cascade="all, delete-orphan")


class SkillAlias(Base):
    __tablename__ = "skill_aliases"

    id = Column(Integer, primary_key=True, index=True)
    alias = Column(String, unique=True, index=True, nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)

    # Relationships
    skill = relationship("Skill", back_populates="aliases")


class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    candidate_id = Column(Integer, ForeignKey("candidates.id"), primary_key=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), primary_key=True)
    confidence_score = Column(Float, default=1.0)
    years_of_experience = Column(Float, nullable=True)

    # Relationships
    candidate = relationship("Candidate", back_populates="skills")
    skill = relationship("Skill", back_populates="candidates")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    
    strengths = Column(Text, nullable=True)  # JSON list
    weaknesses = Column(Text, nullable=True)  # JSON list
    missing_skills = Column(Text, nullable=True)  # JSON list
    recommendation_text = Column(Text, nullable=True)
    interview_ready = Column(Boolean, default=False)
    match_score = Column(Float, default=0.0)

    # Relationships
    candidate = relationship("Candidate", back_populates="recommendations")
    job = relationship("Job", back_populates="recommendations")


class RecruiterFeedback(Base):
    __tablename__ = "recruiter_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    status = Column(String, nullable=False)  # Hired, Rejected, Shortlisted
    feedback = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    candidate = relationship("Candidate", back_populates="feedbacks")
    job = relationship("Job", back_populates="feedbacks")


class EmbeddingMetadata(Base):
    __tablename__ = "embedding_metadata"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False)  # "candidate" or "job"
    entity_id = Column(Integer, nullable=False)
    section_type = Column(String, nullable=False)  # "summary", "skills", "experience", "projects", "education"
    faiss_index_id = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint('entity_type', 'entity_id', 'section_type', name='_entity_section_uc'),
    )
