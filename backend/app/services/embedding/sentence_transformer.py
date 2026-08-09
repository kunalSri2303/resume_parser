import threading
import torch
# Disable PyTorch internal OpenMP multithreading to prevent segmentation faults inside FastAPI worker threads
torch.set_num_threads(1)

from sentence_transformers import SentenceTransformer
from app.config import settings
from app.services.embedding.base_embedding import EmbeddingProvider
from app.utils.logger import logger

class SentenceTransformersProvider(EmbeddingProvider):
    _model = None
    _lock = threading.Lock()

    def __init__(self):
        if SentenceTransformersProvider._model is None:
            logger.info(f"Initializing SentenceTransformers model: {settings.EMBEDDING_MODEL_NAME}")
            try:
                SentenceTransformersProvider._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
                logger.info("SentenceTransformers model loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load SentenceTransformers model: {e}")
                raise e
        self.model = SentenceTransformersProvider._model
        self.lock = SentenceTransformersProvider._lock

    def get_embedding(self, text: str) -> list[float]:
        # Handle empty/none inputs
        if not text or not text.strip():
            # Return empty embedding (or zero vector, but let's return a vector of zeros with appropriate dim)
            # Default dimension for bge-small-en-v1.5 is 384
            return [0.0] * 384
        
        try:
            with self.lock:
                vector = self.model.encode(text, normalize_embeddings=True)
            return vector.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise e

    def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        
        # Clean input strings
        cleaned_texts = [t if (t and t.strip()) else "" for t in texts]
        
        try:
            with self.lock:
                vectors = self.model.encode(cleaned_texts, normalize_embeddings=True)
            return vectors.tolist()
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            raise e
