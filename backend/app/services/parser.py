import io
import re
import zipfile
from pathlib import Path
import fitz  # PyMuPDF
import docx
from app.utils.logger import logger

class ParserService:
    @staticmethod
    def clean_text(text: str) -> str:
        """
        Cleans raw extracted text:
        - Normalizes line endings
        - Removes duplicate whitespaces
        - Filters out lone page numbers (e.g. 'Page 1 of 5', '1/3')
        - Removes consecutive blank lines
        """
        if not text:
            return ""
            
        # Normalize line endings
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            cleaned_line = line.strip()
            
            # Skip empty lines
            if not cleaned_line:
                continue
                
            # Filter page number headers/footers
            if re.match(r'^(?:page|pg\.?)\s*\d+(?:\s*(?:of|/)\s*\d+)?$', cleaned_line, re.IGNORECASE):
                continue
            if re.match(r'^\d+\s*/\s*\d+$', cleaned_line):
                continue
                
            # Replace multiple spaces with a single space
            cleaned_line = re.sub(r'\s+', ' ', cleaned_line)
            cleaned_lines.append(cleaned_line)
            
        return "\n".join(cleaned_lines)

    @staticmethod
    def parse_pdf(file_bytes: bytes) -> str:
        """
        Extracts text from PDF bytes.
        Uses layout-based sorting (top-to-bottom, left-to-right) for multi-column compatibility.
        """
        try:
            text = []
            with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                for page in doc:
                    # Using sort=True sorts text blocks in reading flow
                    page_text = page.get_text("text", sort=True)
                    if page_text:
                        text.append(page_text)
            
            raw_text = "\n".join(text)
            cleaned_text = ParserService.clean_text(raw_text)
            logger.info("PDF file parsed and cleaned successfully.")
            return cleaned_text
        except Exception as e:
            logger.error(f"Failed to parse PDF: {e}")
            raise ValueError(f"Error parsing PDF: {e}")

    @staticmethod
    def is_scanned_pdf(file_bytes: bytes) -> bool:
        """
        Heuristic to detect if a PDF is scanned.
        Checks if the extracted text length is extremely low.
        """
        try:
            text_len = 0
            with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                for page in doc:
                    text_len += len(page.get_text().strip())
            
            # If average text per page is less than 50 characters, assume scanned PDF
            logger.info(f"PDF selectable text check: {text_len} characters extracted.")
            return text_len < 100
        except Exception as e:
            logger.error(f"Error checking if PDF is scanned: {e}")
            return True

    @staticmethod
    def render_pdf_to_images(file_bytes: bytes) -> list[bytes]:
        """Renders PDF pages into PNG images for OCR fallback."""
        images = []
        try:
            logger.info("Rendering PDF pages to images for OCR.")
            with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                for page in doc:
                    # Render page at 150 DPI for reasonable legibility
                    pix = page.get_pixmap(dpi=150)
                    img_bytes = pix.tobytes("png")
                    images.append(img_bytes)
            logger.info(f"Rendered {len(images)} pages successfully.")
            return images
        except Exception as e:
            logger.error(f"Failed to render PDF to images: {e}")
            raise ValueError(f"Error rendering PDF: {e}")

    @staticmethod
    def parse_docx(file_bytes: bytes) -> str:
        """
        Extracts text from DOCX bytes including paragraphs,
        nested tables, and headers/footers.
        """
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            text = []
            
            # 1. Extract from headers & footers (often holds contact info)
            for section in doc.sections:
                if section.header:
                    for para in section.header.paragraphs:
                        if para.text.strip():
                            text.append(para.text)
                if section.footer:
                    for para in section.footer.paragraphs:
                        if para.text.strip():
                            text.append(para.text)

            # 2. Extract from core paragraphs
            for para in doc.paragraphs:
                if para.text.strip():
                    text.append(para.text)
            
            # 3. Extract from tables
            for table in doc.tables:
                for row in table.rows:
                    row_text = []
                    for cell in row.cells:
                        # Extract all cell paragraphs individually to preserve spacing
                        cell_paras = [p.text.strip() for p in cell.paragraphs if p.text.strip()]
                        cell_txt = " ".join(cell_paras)
                        if cell_txt:
                            row_text.append(cell_txt)
                    if row_text:
                        text.append(" | ".join(row_text))
                        
            raw_text = "\n".join(text)
            cleaned_text = ParserService.clean_text(raw_text)
            logger.info("DOCX file parsed and cleaned successfully.")
            return cleaned_text
        except Exception as e:
            logger.error(f"Failed to parse DOCX: {e}")
            raise ValueError(f"Error parsing DOCX: {e}")

    @staticmethod
    def parse_file(file_bytes: bytes, filename: str) -> str:
        """Parses a file based on its extension."""
        suffix = Path(filename).suffix.lower()
        if suffix == ".pdf":
            return ParserService.parse_pdf(file_bytes)
        elif suffix == ".docx":
            return ParserService.parse_docx(file_bytes)
        else:
            logger.error(f"Unsupported file format for parsing: {filename}")
            raise ValueError(f"Unsupported file format: {suffix}. Only PDF and DOCX are supported.")

    @staticmethod
    def extract_zip(zip_bytes: bytes) -> list[tuple[str, bytes]]:
        """
        Unzips bytes, filters files by supported formats (PDF, DOCX),
        and returns a list of tuples containing (filename, raw_bytes).
        """
        extracted_files = []
        try:
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
                for file_info in zf.infolist():
                    # Security Check: Prevent directory traversal attacks
                    # Resolve path to ensure it doesn't escape
                    filename = Path(file_info.filename).name
                    if not filename or file_info.filename.startswith("..") or "/../" in file_info.filename:
                        logger.warning(f"Security: skipped traversal path entry: {file_info.filename}")
                        continue
                    
                    if file_info.is_dir() or file_info.filename.startswith("__MACOSX") or filename.startswith("."):
                        continue
                    
                    suffix = Path(filename).suffix.lower()
                    if suffix in [".pdf", ".docx"]:
                        file_data = zf.read(file_info.filename)
                        extracted_files.append((filename, file_data))
                        
            logger.info(f"Successfully extracted {len(extracted_files)} resumes from ZIP.")
            return extracted_files
        except Exception as e:
            logger.error(f"Failed to unzip archive: {e}")
            raise ValueError(f"Error reading ZIP file: {e}")
