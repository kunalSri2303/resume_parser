import faiss
import numpy as np
import threading
from pathlib import Path
from app.config import settings
from app.utils.logger import logger

class VectorStoreService:
    _shared_index = None
    _lock = threading.Lock()

    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.index_dir = settings.vector_dir_path
        self.index_dir.mkdir(parents=True, exist_ok=True)
        self.index_path = self.index_dir / "index.faiss"

    @property
    def index(self):
        if VectorStoreService._shared_index is None:
            self.load_or_create_index()
        return VectorStoreService._shared_index

    @index.setter
    def index(self, value):
        VectorStoreService._shared_index = value

    def load_or_create_index(self):
        """Lazy loads index from disk, or creates a new one if not present."""
        with VectorStoreService._lock:
            if VectorStoreService._shared_index is not None:
                return
            if self.index_path.exists():
                try:
                    logger.info(f"Lazy-loading FAISS index from {self.index_path}")
                    VectorStoreService._shared_index = faiss.read_index(str(self.index_path))
                    logger.info(f"FAISS index loaded into memory. Total vectors: {VectorStoreService._shared_index.ntotal}")
                except Exception as e:
                    logger.error(f"Failed to load FAISS index: {e}. Recreating...")
                    self._create_new_index()
            else:
                self._create_new_index()

    def _create_new_index(self):
        """Initializes a new FAISS index with ID mapping capabilities."""
        logger.info(f"Creating a new FAISS index with dimension {self.dimension}")
        sub_index = faiss.IndexFlatIP(self.dimension)
        VectorStoreService._shared_index = faiss.IndexIDMap(sub_index)
        self.save_index()

    def save_index(self):
        """Saves current state of the index to disk."""
        try:
            self.index_dir.mkdir(parents=True, exist_ok=True)
            if VectorStoreService._shared_index is not None:
                faiss.write_index(VectorStoreService._shared_index, str(self.index_path))
                logger.info(f"Saved FAISS index to {self.index_path} (vectors: {VectorStoreService._shared_index.ntotal})")
        except Exception as e:
            logger.error(f"Failed to save FAISS index: {e}")

    def sync_with_disk(self):
        """Syncs the in-memory FAISS index with the index file on disk."""
        if self.index_path.exists():
            try:
                with VectorStoreService._lock:
                    VectorStoreService._shared_index = faiss.read_index(str(self.index_path))
            except Exception as e:
                logger.error(f"Failed to reload FAISS index from disk: {e}")
        else:
            if self.index is not None and self.index.ntotal > 0:
                logger.info("FAISS index file not found on disk. Resetting in-memory index to empty.")
                self._create_new_index()

    def add_vectors(self, vectors: list[list[float]], ids: list[int]):
        """Adds a list of embeddings with matching IDs to the FAISS index."""
        self.sync_with_disk()
        if not vectors or not ids:
            return
        
        if len(vectors) != len(ids):
            raise ValueError("Size of vectors list must match size of IDs list.")

        np_vectors = np.array(vectors, dtype=np.float32)
        np_ids = np.array(ids, dtype=np.int64)

        faiss.normalize_L2(np_vectors)
        
        self.index.add_with_ids(np_vectors, np_ids)
        self.save_index()
        logger.info(f"Added {len(ids)} vectors to FAISS index.")

    def remove_vectors(self, ids: list[int]):
        """Removes vectors from the index by their IDs."""
        self.sync_with_disk()
        if not ids:
            return
        
        try:
            np_ids = np.array(ids, dtype=np.int64)
            num_removed = self.index.remove_ids(np_ids)
            self.save_index()
            logger.info(f"Removed {num_removed} vectors from FAISS index matching IDs: {ids}")
        except Exception as e:
            logger.error(f"Failed to remove vectors from FAISS: {e}")

    def search(self, query_vector: list[float], top_k: int = 10) -> list[tuple[int, float]]:
        """
        Searches the FAISS index for the query vector.
        Returns a list of tuples: (id, similarity_score).
        """
        self.sync_with_disk()
        if self.index.ntotal == 0:
            logger.warning("FAISS search called on an empty index.")
            return []

        search_k = min(top_k, self.index.ntotal)

        np_query = np.array([query_vector], dtype=np.float32)
        faiss.normalize_L2(np_query)

        scores, indices = self.index.search(np_query, search_k)
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            results.append((int(idx), float(score)))
            
        logger.info(f"FAISS search returned {len(results)} matches.")
        return results
