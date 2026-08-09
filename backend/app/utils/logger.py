import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

# Base directory for logging logs file
LOG_DIR = Path(__file__).resolve().parent.parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / "recruitment_platform.log"

def setup_logger(name: str = "recruitment_platform") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Avoid duplicate handlers if logger is already setup
    if logger.handlers:
        return logger

    # Log formatter
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s [%(name)s:%(filename)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler (Rotating, max 10MB per file, backup count 5)
    try:
        file_handler = RotatingFileHandler(
            LOG_FILE, maxBytes=10*1024*1024, backupCount=5, encoding="utf-8"
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except Exception as e:
        print(f"Failed to setup file logging handler: {e}")

    return logger

# Shared logger instance
logger = setup_logger()
