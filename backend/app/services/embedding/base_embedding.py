from abc import ABC, abstractmethod

class EmbeddingProvider(ABC):
    @abstractmethod
    def get_embedding(self, text: str) -> list[float]:
        """
        Generates a vector embedding for the given input text.
        """
        pass

    @abstractmethod
    def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        """
        Generates a list of vector embeddings for a list of input texts.
        """
        pass
