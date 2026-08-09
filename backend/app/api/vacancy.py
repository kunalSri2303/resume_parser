from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.parser import ParserService
from app.services.extractor import get_llm_provider
from app.schemas.schemas import VacancyExtractionSchema
from app.utils.logger import logger

router = APIRouter(prefix="", tags=["Vacancies"])
llm_provider = get_llm_provider()

@router.post("/extract-vacancy")
async def extract_vacancy(file: UploadFile = File(...)):
    """
    Extracts structured Vacancy / Demand Letter information from documents (PDF, JPG, JPEG, PNG).
    Handles scanned PDFs and images via multimodal AI OCR.
    Returns structured JSON with requisition header details, positions array, and confidence scores.
    """
    filename = file.filename or "vacancy_document"
    suffix = Path(filename).suffix.lower()
    
    supported_formats = [".pdf", ".docx", ".jpg", ".jpeg", ".png"]
    if suffix not in supported_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{suffix}'. Supported formats: .pdf, .docx, .jpg, .jpeg, .png"
        )
        
    try:
        content = await file.read()
        extracted_text = ""
        
        # 1. Handle PDF Documents
        if suffix == ".pdf":
            try:
                raw_text = ParserService.parse_pdf(content)
            except Exception:
                raw_text = ""
                
            # Check if PDF is scanned or text extraction is insufficient
            is_scanned = ParserService.is_scanned_pdf(content) or len(raw_text.strip()) < 50
            if is_scanned:
                logger.info(f"PDF '{filename}' detected as scanned/image-based. Performing multi-page OCR...")
                images = ParserService.render_pdf_to_images(content)
                ocr_texts = []
                for idx, img_bytes in enumerate(images):
                    logger.info(f"Performing OCR on PDF page {idx + 1}/{len(images)}...")
                    page_text = await llm_provider.transcribe_image(img_bytes)
                    if page_text:
                        ocr_texts.append(f"=== DOCUMENT PAGE {idx + 1} OF {len(images)} ===\n{page_text}")
                extracted_text = "\n\n".join(ocr_texts)
            else:
                extracted_text = raw_text
                
        # 2. Handle DOCX Documents
        elif suffix == ".docx":
            extracted_text = ParserService.parse_docx(content)

        # 3. Handle Image Files (JPG, JPEG, PNG)
        elif suffix in [".jpg", ".jpeg", ".png"]:
            logger.info(f"Performing multimodal OCR on image '{filename}'...")
            extracted_text = await llm_provider.transcribe_image(content)
            
        if not extracted_text or len(extracted_text.strip()) < 10:
            raise HTTPException(
                status_code=422,
                detail="Unable to extract legible text from the uploaded document."
            )
            
        logger.info(f"Extracting structured vacancy schema from text ({len(extracted_text)} chars)...")
        raw_vacancy_dict = await llm_provider.extract_vacancy(extracted_text)
        
        # Validate against schema
        validated_vacancy = VacancyExtractionSchema.model_validate(raw_vacancy_dict)
        
        return {
            "status": "success",
            "filename": filename,
            "extracted_text_snippet": extracted_text[:300],
            "data": validated_vacancy.model_dump()
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error processing vacancy extraction for '{filename}': {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Vacancy extraction failed: {str(e)}"
        )
