import os
from pathlib import Path
from app.config import settings
from app.services.storage.base_storage import StorageService
from app.utils.logger import logger

class LocalStorage(StorageService):
    def __init__(self):
        self.upload_dir = settings.upload_dir_path
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def save_file(self, content: bytes, file_name: str) -> str:
        # Secure or sanitize filename if needed, here we just resolve it
        dest_path = self.upload_dir / file_name
        
        # Avoid overwriting directly if name conflicts, add counter if needed
        # but standard is to save directly or overwrite
        with open(dest_path, "wb") as f:
            f.write(content)
        
        logger.info(f"File saved successfully to local storage: {dest_path}")
        return str(dest_path)

    def get_file(self, file_path: str) -> bytes:
        path = Path(file_path)
        if not path.exists():
            logger.error(f"File not found in local storage: {file_path}")
            raise FileNotFoundError(f"File not found: {file_path}")
        
        with open(path, "rb") as f:
            return f.read()

    def delete_file(self, file_path: str) -> bool:
        path = Path(file_path)
        if path.exists():
            os.remove(path)
            logger.info(f"Deleted file from local storage: {file_path}")
            return True
        logger.warning(f"File to delete not found: {file_path}")
        return False
