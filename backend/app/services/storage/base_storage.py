from abc import ABC, abstractmethod

class StorageService(ABC):
    @abstractmethod
    def save_file(self, content: bytes, file_name: str) -> str:
        """
        Saves file content with the given file name.
        Returns the path or identifier to retrieve the file.
        """
        pass

    @abstractmethod
    def get_file(self, file_path: str) -> bytes:
        """
        Retrieves raw content of file.
        """
        pass

    @abstractmethod
    def delete_file(self, file_path: str) -> bool:
        """
        Deletes file from storage.
        """
        pass
