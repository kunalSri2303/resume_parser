from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.database import engine, Base
from app.api import resume, jobs, search, recommendation, feedback, analytics, vacancy, auth
from app.database.database import SessionLocal
from app.database.operations import get_user_by_username, create_user
import bcrypt
from app.utils.logger import logger

# Initialize database tables on startup
logger.info("Initializing database tables...")
Base.metadata.create_all(bind=engine)

# Seed default user accounts in database if absent
try:
    db_session = SessionLocal()
    admin_user = get_user_by_username(db_session, "admin")
    if not admin_user:
        admin_hash = bcrypt.hashpw(b"AdminPassword2026!", bcrypt.gensalt()).decode("utf-8")
        create_user(db_session, "admin", admin_hash, "admin")
        logger.info("Seeded initial 'admin' user into database.")

    hm_user = get_user_by_username(db_session, "hiringmanager")
    if not hm_user:
        hm_hash = bcrypt.hashpw(b"ManagerPassword2026!", bcrypt.gensalt()).decode("utf-8")
        create_user(db_session, "hiringmanager", hm_hash, "hiring_manager")
        logger.info("Seeded initial 'hiringmanager' user into database.")
    db_session.close()
except Exception as seed_err:
    logger.warning(f"Initial user seed check: {seed_err}")

# Programmatically add missing columns if they don't exist (SQLite schema migration safety)
try:
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    if "candidates" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("candidates")]
        if "personal_information" not in columns:
            logger.info("Adding personal_information column to candidates table...")
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE candidates ADD COLUMN personal_information TEXT DEFAULT '{}'"))
            logger.info("personal_information column added successfully.")

    if "jobs" in inspector.get_table_names():
        job_columns = [col["name"] for col in inspector.get_columns("jobs")]
        if "interview_date" not in job_columns:
            logger.info("Adding interview_date column to jobs table...")
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE jobs ADD COLUMN interview_date VARCHAR"))
            logger.info("interview_date column added to jobs table successfully.")
except Exception as e:
    logger.warning(f"Failed to check/add database columns: {e}")

logger.info("Database tables initialized successfully.")

app = FastAPI(
    title="Recruitment Intelligence Platform API",
    description="AI-powered candidate resume parsing, semantic matching, and recommendation platform.",
    version="1.0.0"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock this down to the frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(resume.router)
app.include_router(jobs.router)
app.include_router(search.router)
app.include_router(recommendation.router)
app.include_router(feedback.router)
app.include_router(analytics.router)
app.include_router(vacancy.router)
app.include_router(auth.router, prefix="/api")

@app.get("/")
def get_root_status():
    """Welcome and health check status endpoint."""
    return {
        "status": "online",
        "service": "AI Recruitment Intelligence Platform API",
        "active_llm": settings.LLM_PROVIDER,
        "active_embedding": settings.EMBEDDING_PROVIDER
    }
