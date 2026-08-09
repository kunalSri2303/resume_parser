from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ExperienceSchema(BaseModel):
    title: str
    company: str
    duration: Optional[str] = None
    description: Optional[str] = None

class EducationSchema(BaseModel):
    degree: str
    institution: str
    graduation_year: Optional[str] = None
    field_of_study: Optional[str] = None

class ProjectSchema(BaseModel):
    name: str
    description: Optional[str] = None
    technologies_used: List[str] = []

class SkillResponseSchema(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class CandidateSkillResponseSchema(BaseModel):
    skill: SkillResponseSchema
    confidence_score: float
    years_of_experience: Optional[float] = None

    class Config:
        from_attributes = True



class JobCreateSchema(BaseModel):
    title: str
    location: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    interview_date: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)

class JobUpdateSchema(BaseModel):
    title: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    interview_date: Optional[str] = None
    skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None

class JobResponseSchema(BaseModel):
    id: int
    title: str
    location: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    interview_date: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    upload_date: datetime

    class Config:
        from_attributes = True

class RecruiterFeedbackCreateSchema(BaseModel):
    candidate_id: int
    job_id: int
    status: str = Field(..., description="Must be Hired, Rejected, or Shortlisted")
    feedback: Optional[str] = None

class RecruiterFeedbackResponseSchema(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    status: str
    feedback: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class SearchQuerySchema(BaseModel):
    query: str
    top_k: Optional[int] = 10

class SearchResultSchema(BaseModel):
    candidate: "CandidateResponseSchema"
    score: float

class MatchResultSchema(BaseModel):
    candidate_id: int
    name: str
    email: str
    role: Optional[str] = None
    overall_score: float
    section_scores: dict

class RecommendationResponseSchema(BaseModel):
    candidate_id: int
    job_id: int
    strengths: List[str]
    weaknesses: List[str]
    missing_skills: List[str]
    recommendation_text: str
    interview_ready: bool
    match_score: float

class AnalyticsSchema(BaseModel):
    total_candidates: int
    total_jobs: int
    average_experience: float
    skill_distribution: dict
    hiring_funnel: dict
    candidate_locations: dict
    experience_distribution: dict
    resume_upload_trends: dict
      

class PersonalInformationSchema(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    nationality: Optional[str] = None
    
class ProfessionSchema(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None
    industry: Optional[str] = None
    current_role: Optional[str] = None
    target_roles: List[str] = Field(default_factory=list)
    current_company: Optional[str] = None
    experience_years: Optional[float] = None
    seniority: Optional[str] = None
    employment_type: Optional[str] = None
    
class SkillsSchema(BaseModel):
    technical: List[str] = Field(default_factory=list)
    soft: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    frameworks: List[str] = Field(default_factory=list)
    equipment: List[str] = Field(default_factory=list)
    standards: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    methodologies: List[str] = Field(default_factory=list)


class ExperienceDetailSchema(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None
    key_achievements: List[str] = Field(default_factory=list)
    
class EducationDetailSchema(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_year: Optional[str] = None
    cgpa_or_percentage: Optional[str] = None
    

class AchievementSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    metrics: Optional[str] = None

class LicenseSchema(BaseModel):
    name: Optional[str] = None
    issuing_authority: Optional[str] = None
    license_number: Optional[str] = None
    expiry_date: Optional[str] = None


class CertificationSchema(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    credential_id: Optional[str] = None
    
class ProjectDetailSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    technologies_used: List[str] = Field(default_factory=list)
    tools_used: List[str] = Field(default_factory=list)
    role: Optional[str] = None
    github_url: Optional[str] = None
    project_url: Optional[str] = None 
    
class DocumentsSchema(BaseModel):
    resume_available: bool = True
    cover_letter_available: bool = False
    certificates_available: bool = False


class ConfidenceSchema(BaseModel):
    name: Optional[float] = None
    email: Optional[float] = None
    phone: Optional[float] = None
    profession: Optional[float] = None
    skills: Optional[float] = None
    experience: Optional[float] = None

class ResumeExtractionSchema(BaseModel):
    personal_information: PersonalInformationSchema
    profession: ProfessionSchema
    skills: SkillsSchema

    experience: List[ExperienceDetailSchema] = Field(default_factory=list)
    education: List[EducationDetailSchema] = Field(default_factory=list)
    projects: List[ProjectDetailSchema] = Field(default_factory=list)

    certifications: List[CertificationSchema] = Field(default_factory=list)
    licenses: List[LicenseSchema] = Field(default_factory=list)
    achievements: List[AchievementSchema] = Field(default_factory=list)

    summary: Optional[str] = None

    documents: DocumentsSchema = Field(default_factory=DocumentsSchema)

    search_keywords: List[str] = Field(default_factory=list)

    confidence: Optional[ConfidenceSchema] = None


class CandidateResponseSchema(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    experience_years: float
    current_company: Optional[str] = None
    role: Optional[str] = None
    notice_period: Optional[str] = None
    expected_salary: Optional[str] = None
    preferred_location: Optional[str] = None
    resume_path: Optional[str] = None
    summary: Optional[str] = None
    upload_date: datetime
    skills: List[CandidateSkillResponseSchema]
    education: List[EducationDetailSchema] = []
    projects: List[ProjectDetailSchema] = []
    certifications: List[str] = []
    languages: List[str] = []
    
    # Nested schemas matching the new extraction schema
    personal_information: Optional[PersonalInformationSchema] = None
    profession: Optional[ProfessionSchema] = None
    categorized_skills: Optional[SkillsSchema] = None
    experience: List[ExperienceDetailSchema] = []
    certifications_nested: List[CertificationSchema] = []
    licenses: List[LicenseSchema] = []
    achievements: List[AchievementSchema] = []
    documents: Optional[DocumentsSchema] = None
    search_keywords: List[str] = []
    confidence: Optional[ConfidenceSchema] = None
    recommendations: List[dict] = []
    feedbacks: List[dict] = []

    class Config:
        from_attributes = True


class VacancyPositionSchema(BaseModel):
    title: str = "Position"
    quantity: Optional[int] = None
    salary: Optional[str] = None
    currency: Optional[str] = None
    experience_required: Optional[str] = None
    education_required: Optional[str] = None
    interview_date: Optional[str] = None
    skills_required: List[str] = Field(default_factory=list)
    job_description: Optional[str] = None
    benefits: Optional[str] = None
    notes: Optional[str] = None
    confidence: Optional[dict] = Field(default_factory=dict)


class VacancyExtractionSchema(BaseModel):
    company_name: Optional[str] = None
    client_name: Optional[str] = None
    country: Optional[str] = None
    demand_letter_number: Optional[str] = None
    working_hours: Optional[str] = None
    contract_years: Optional[str] = None
    received_date: Optional[str] = None
    expiry_date: Optional[str] = None
    interview_date: Optional[str] = None
    interview_type: Optional[str] = None
    interview_location: Optional[str] = None
    received_from: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    accommodation_provided: Optional[str] = None
    transport_provided: Optional[str] = None
    food_provided: Optional[str] = None
    positions: List[VacancyPositionSchema] = Field(default_factory=list)
    confidence: Optional[dict] = Field(default_factory=dict)


# User Authentication Schemas
class UserLoginRequestSchema(BaseModel):
    username: str
    password: str
    role: str = "admin"

class ChangePasswordRequestSchema(BaseModel):
    current_password: Optional[str] = None
    new_password: str
    target_username: Optional[str] = None
    requester_role: Optional[str] = "admin"

class UserResponseSchema(BaseModel):
    id: int
    username: str
    role: str
    updated_at: datetime

    class Config:
        from_attributes = True