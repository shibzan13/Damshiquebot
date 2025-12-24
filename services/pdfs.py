import fitz  # PyMuPDF
import os
import aiosqlite
from services.db import insert_expenses
from services.gemini_ai import extract_expense_from_text
from services.template_extractor import extract_with_templates

async def extract_pdf_text(file_path):
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text.strip()
    except Exception as e:
        print(f"❌ PDF extraction failed: {e}")
        return ""

async def save_pdf(user_phone, media_id, filename, file_path, mime_type, doc_type="document"):
    print(f"📖 Extracting text from PDF: {file_path}")
    text = await extract_pdf_text(file_path)
    
    ocr_result = {
        "text": text,
        "ocrMethod": "pdf_text",
        "extractedData": None,
        "confidence": 0.8 if text else 0
    }
    
    if text:
        # Try AI enhancement
        extracted_data = await extract_expense_from_text(text)
        if extracted_data:
            ocr_result["ocrMethod"] += "+ai"
            ocr_result["extractedData"] = extracted_data
        else:
            extracted_data = extract_with_templates(text)
            if extracted_data:
                ocr_result["ocrMethod"] += "+template"
                ocr_result["extractedData"] = extracted_data

    # Save to documents table
    from services.documents import save_document
    await save_document(user_phone, media_id, filename, file_path, mime_type, doc_type, ocr_result)
    
    # If it's an expense, insert to expenses table
    if ocr_result["extractedData"]:
        await insert_expenses(user_phone, [ocr_result["extractedData"]], "pdf", file_path)
        
    return ocr_result
