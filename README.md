# AI Recruitment Intelligence Hub

A production-ready, modular, and scalable AI-powered recruitment platform designed for recruiters to automate candidate parsing, run semantic matching profiles against job descriptions, and view interactive visual dashboard analytics.

---

## Technical Architecture & Core Principles

- **Hybrid Extraction Pipeline**: Deterministic contact information (Email, Phone, LinkedIn, GitHub, Portfolio URLs) is resolved using regular expression parsers. High-level attributes (Skills, Experience, Projects, Education) are enhanced via LLM prompts. Graceful fallback ensures resume uploads work offline if LLM services are rate-limited.
- **FastAPI Asynchronous Background Pipeline**: Resume uploads return immediately. Text extraction, structured enhancement, canonical skill normalization, multi-section indexing, and Excel syncing run in the background.
- **Sectioned FAISS Vector Storage**: Rather than embedding full resumes in a single document vector, resumes are chunked into 5 distinct section profiles (`Summary`, `Skills`, `Experience`, `Projects`, `Education`).
- **Weighted Match Quality Engine**: Matches candidate sections against job parameters using custom-weighted relevance multipliers:
  - **Skills Match**: 40%
  - **Experience Alignment**: 30%
  - **Projects Similarity**: 15%
  - **Education Match**: 10%
  - **Core Summary**: 5%
- **Recruiter Feedback Loop**: Tracks decisions (`Shortlisted`, `Hired`, `Rejected`) to feed future machine learning ranking algorithms.

---

## Tech Stack

### Backend
- **FastAPI**: Asynchronous web server.
- **SQLite + SQLAlchemy**: Persistent candidate and job relational repository.
- **PyMuPDF & python-docx**: Document text extraction.
- **Google Gemini 1.5 Flash**: Structured profile enhancement, summary writer, and recommendation explanation.
- **Sentence Transformers (BAAI/bge-small-en-v1.5)**: Local embedding model (384 dimensions).
- **FAISS**: Section vector similarities index.
- **Pandas & OpenPyXL**: candidate sync sheet (`excel/Candidates.xlsx`).

### Frontend
- **React (Vite)**: Component layout framework.
- **Tailwind CSS**: Sleek dark-mode interface.
- **Lucide Icons**: Micro-interaction UI indicators.
- **Axios**: API request handler.

---

## Project Structure

```
ai-recruitment-platform/
  backend/
    app/
      api/            # FastAPI Routers (resume, jobs, search, recommendation, analytics, feedback)
      database/       # SQL Models and SQLite engine setup
      schemas/        # Pydantic validation schemas
      services/       # Logic layer (parsers, normalizers, embeddings, matching, vector stores)
      utils/          # Central logger and mapping resources
      prompts/        # Isolated System Prompt templates (.md files)
      config.py       # Pydantic Settings environment configuration
      main.py         # Bootstrap server file
    tests/            # Pytest testing suite
    .env              # Platform settings environment variables
    requirements.txt  # Python requirements list
  frontend/           # React Client files
```

---

## Setup & Running Guide

### 1. Run the Backend API

1. Navigate to the backend directory and create a virtual environment:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   Copy `.env` and fill in your Gemini API key:
   ```bash
   cp .env.template .env # Update GEMINI_API_KEY in the file
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Explore the Swagger documentation at `http://localhost:8000/docs`.

### 2. Run the Frontend Client

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## API Endpoints

- `POST /upload-resume`: Ingests single, multiple, or zip resumes.
- `POST /upload-job`: Creates a job opening from text or uploads (PDF/DOCX).
- `GET /candidates`: Lists all candidates.
- `GET /candidate/{id}`: Gets details of a candidate.
- `GET /jobs`: Lists all job descriptions.
- `GET /job/{id}`: Gets details of a job description.
- `POST /match/{job_id}`: Computes weighted candidate match rankings.
- `GET /recommendation/{candidate_id}/{job_id}`: AI recommendation and scores explanation.
- `POST /search`: Natural language queries against candidate embeddings.
- `POST /feedback`: Records shortlisted/hired/rejected decisions.
- `GET /analytics`: Dashboard summaries.
