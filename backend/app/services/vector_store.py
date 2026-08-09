import faiss
import numpy as np
from pathlib import Path
from app.config import settings
from app.utils.logger import logger

class VectorStoreService:
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.index_dir = settings.vector_dir_path
        self.index_dir.mkdir(parents=True, exist_ok=True)
        self.index_path = self.index_dir / "index.faiss"
        self.index = None
        self.load_or_create_index()

    def load_or_create_index(self):
        """Loads index from disk, or creates a new one if not present."""
        if self.index_path.exists():
            try:
                logger.info(f"Loading FAISS index from {self.index_path}")
                self.index = faiss.read_index(str(self.index_path))
                logger.info(f"FAISS index loaded. Total vectors: {self.index.ntotal}")
            except Exception as e:
                logger.error(f"Failed to load FAISS index: {e}. Recreating...")
                self._create_new_index()
        else:
            self._create_new_index()

    def _create_new_index(self):
        """Initializes a new FAISS index with ID mapping capabilities."""
        logger.info(f"Creating a new FAISS index with dimension {self.dimension}")
        # IndexFlatIP uses Inner Product (equivalent to Cosine Similarity when vectors are L2-normalized)
        sub_index = faiss.IndexFlatIP(self.dimension)
        # Wrap index in IDMap so we can specify custom integer IDs matching database mappings
        self.index = faiss.IndexIDMap(sub_index)
        self.save_index()

    def save_index(self):
        """Saves current state of the index to disk."""
        try:
            self.index_dir.mkdir(parents=True, exist_ok=True)
            faiss.write_index(self.index, str(self.index_path))
            logger.info(f"Saved FAISS index to {self.index_path} (vectors: {self.index.ntotal})")
        except Exception as e:
            logger.error(f"Failed to save FAISS index: {e}")

    def sync_with_disk(self):
        """Syncs the in-memory FAISS index with the index file on disk."""
        if self.index_path.exists():
            try:
                self.index = faiss.read_index(str(self.index_path))
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

        # L2-normalization for Cosine Similarity search
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

        # Prevent FAISS C++ segmentation fault when top_k exceeds total vectors
        search_k = min(top_k, self.index.ntotal)

        np_query = np.array([query_vector], dtype=np.float32)
        faiss.normalize_L2(np_query)

        # FAISS search returns: (distances/scores matrix, indices/ids matrix)
        scores, indices = self.index.search(np_query, search_k)
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:  # FAISS uses -1 for empty search slots
                continue
            # Convert float32 score to Python float
            results.append((int(idx), float(score)))
            
        logger.info(f"FAISS search returned {len(results)} matches.")
        return results
