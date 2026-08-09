import os
from pathlib import Path

# Disable tokenizer parallelism and limit math libraries to 1 thread to avoid C++ OpenMP segfaults on macOS
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory of the backend folder
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    # LLM Provider Configuration
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    
    # Embedding Configuration
    EMBEDDING_PROVIDER: str = "sentence-transformers"
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"
    
    # Database
    DATABASE_URL: str = "sqlite:///./recruitment.db"
    
    # Storage & Paths
    UPLOAD_DIR: str = "./uploads"
    EXCEL_PATH: str = "./excel/Candidates.xlsx"
    VECTOR_PATH: str = "./vectors"
    
    # Thresholds
    SIMILARITY_THRESHOLD: float = 0.5

    # Allow custom environment file location
    model_config = SettingsConfigDict(
        env_file=os.path.join(BASE_DIR, ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def upload_dir_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        if not path.is_absolute():
            path = BASE_DIR / path
        return path

    @property
    def excel_file_path(self) -> Path:
        path = Path(self.EXCEL_PATH)
        if not path.is_absolute():
            path = BASE_DIR / path
        return path

    @property
    def vector_dir_path(self) -> Path:
        path = Path(self.VECTOR_PATH)
        if not path.is_absolute():
            path = BASE_DIR / path
        return path

    def create_required_directories(self):
        """Creates the uploads, excel, and vectors directories if they do not exist."""
        self.upload_dir_path.mkdir(parents=True, exist_ok=True)
        self.excel_file_path.parent.mkdir(parents=True, exist_ok=True)
        self.vector_dir_path.mkdir(parents=True, exist_ok=True)

# Instantiate settings
settings = Settings()
# Auto-create folders on startup import
settings.create_required_directories()
