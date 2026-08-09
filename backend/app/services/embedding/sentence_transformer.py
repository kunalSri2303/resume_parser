import threading
from app.config import settings
from app.services.embedding.base_embedding import EmbeddingProvider
from app.utils.logger import logger

class SentenceTransformersProvider(EmbeddingProvider):
    _model = None
    _lock = threading.Lock()

    def __init__(self):
        # Do NOT load model during constructor/import time.
        # Initialization is deferred lazily until an actual embedding request is received.
        pass

    @classmethod
    def _get_model(cls):
        """Thread-safe lazy initializer for SentenceTransformers model."""
        if cls._model is None:
            with cls._lock:
                if cls._model is None:
                    try:
                        import torch
                        torch.set_num_threads(1)
                        from sentence_transformers import SentenceTransformer

                        logger.info(f"Lazy-loading SentenceTransformers model: {settings.EMBEDDING_MODEL_NAME}")
                        cls._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
                        logger.info("SentenceTransformers model loaded successfully into memory.")
                    except Exception as e:
                        logger.error(f"Failed to load SentenceTransformers model: {e}")
                        raise e
        return cls._model

    def get_embedding(self, text: str) -> list[float]:
        # Handle empty/none inputs
        if not text or not text.strip():
            return [0.0] * 384
        
        try:
            model = self._get_model()
            with self._lock:
                vector = model.encode(text, normalize_embeddings=True)
            return vector.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise e

    def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        
        cleaned_texts = [t if (t and t.strip()) else "" for t in texts]
        
        try:
            model = self._get_model()
            with self._lock:
                vectors = model.encode(cleaned_texts, normalize_embeddings=True)
            return vectors.tolist()
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            raise e
