from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.database import engine, Base
from app.api import resume, jobs, search, recommendation, feedback, analytics
from app.utils.logger import logger

# Initialize database tables on startup
logger.info("Initializing database tables...")
Base.metadata.create_all(bind=engine)

# Programmatically add personal_information column if it doesn't exist (SQLite schema migration safety)
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
except Exception as e:
    logger.warning(f"Failed to check/add personal_information column: {e}")

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

@app.get("/")
def get_root_status():
    """Welcome and health check status endpoint."""
    return {
        "status": "online",
        "service": "AI Recruitment Intelligence Platform API",
        "active_llm": settings.LLM_PROVIDER,
        "active_embedding": settings.EMBEDDING_PROVIDER
    }
