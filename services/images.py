import cv2
import numpy as np
import pytesseract
from PIL import Image
import os
import httpx
from services.template_extractor import extract_with_templates
from services.db import insert_expenses
import json
import hashlib

PREPROCESSED_DIR = "uploads/preprocessed"
OCR_CACHE_FILE = "uploads/ocr_cache.json"

if not os.path.exists(PREPROCESSED_DIR):
    os.makedirs(PREPROCESSED_DIR)

def load_ocr_cache():
    if not os.path.exists(OCR_CACHE_FILE):
        return {}
    try:
        with open(OCR_CACHE_FILE, "r") as f:
            return json.load(f)
    except:
        return {}

def save_ocr_cache(cache):
    with open(OCR_CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)

def get_cache_key(file_path):
    with open(file_path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()

def preprocess_image(input_path):
    """
    Advanced preprocessing for receipts:
    1. Grayscale & Denoise
    2. Adaptive Thresholding (handles shadows/uneven light)
    3. Deskewing (rotates image back to 0 degrees if tilted)
    """
    try:
        img = cv2.imread(input_path)
        if img is None:
            return input_path
        
        # 1. Resize if too small (PyTesseract likes ~300 DPI)
        height, width = img.shape[:2]
        if width < 1500:
            scale = 2000 / width
            img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        
        # 2. Grayscale & Bilateral Filtering (removes noise while keeping edges sharp)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)
        
        # 3. Adaptive Thresholding (Crucial for receipts with shadows)
        thresh = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # 4. Morphological operations to clean up tiny dots
        kernel = np.ones((1, 1), np.uint8)
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        
        # 5. Deskewing (Optional but helpful)
        coords = np.column_stack(np.where(cleaned > 0))
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
            
        if abs(angle) > 0.5:
            (h, w) = cleaned.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            cleaned = cv2.warpAffine(cleaned, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

        filename = os.path.basename(input_path)
        output_path = os.path.join(PREPROCESSED_DIR, f"proc_{filename}")
        cv2.imwrite(output_path, cleaned)
        
        print(f"✨ Advanced preprocessing complete (Angle: {angle:.1f}deg)")
        return output_path
    except Exception as e:
        print(f"⚠️ Preprocessing failed: {e}")
        return input_path

async def extract_with_vision_llm(file_path):
    """Use Gemini Vision instead of OpenRouter"""
    from services.gemini_ai import extract_expense_from_image
    
    try:
        result = await extract_expense_from_image(file_path)
        if result:
            # Convert to text format for compatibility
            text = f"""Merchant: {result.get('merchant', 'Unknown')}
Amount: {result.get('amount', 0)} {result.get('currency', 'AED')}
Date: {result.get('date', 'N/A')}
Category: {result.get('category', 'Other')}"""
            print(f"✅ Gemini Vision Analysis Complete")
            return text
    except Exception as e:
        print(f"⚠️ Gemini Vision failed: {e}")
    
    return None

async def process_image_with_ocr(file_path, mime_type=""):
    cache = load_ocr_cache()
    ckey = get_cache_key(file_path)
    if ckey in cache:
        print("✅ Using cached OCR result")
        return cache[ckey]

    ocr_method = "none"
    confidence = 0
    extracted_data = None
    text = ""

    # Strategy 1: Vision LLM (Smartest)
    print("🧠 Attempting Smart Vision OCR...")
    vision_text = await extract_with_vision_llm(file_path)
    
    if vision_text and len(vision_text) > 20:
        text = vision_text
        ocr_method = "vision_llm"
        confidence = 0.95
        
        # Immediate parsing of the smart text
        from services.gemini_ai import extract_expense_from_text
        extracted_data = await extract_expense_from_text(vision_text)
        if extracted_data and extracted_data.get('amount'):
            print("💎 High-confidence extraction from Vision LLM")
            ocr_method += "+ai"
        else:
            # Fallback to templates if AI parsing failed but we have text
            extracted_data = extract_with_templates(vision_text)
            if extracted_data:
                ocr_method += "+template"
                confidence = 0.8
    
    # Strategy 2: Tesseract Fallback (Enhanced with multiple passes)
    if not extracted_data or not extracted_data.get('amount'):
        print("📝 Falling back to Multi-Pass Tesseract OCR...")
        proc_path = preprocess_image(file_path)
        
        # Pass 1: Standard (PSM 3)
        tess_text = pytesseract.image_to_string(Image.open(proc_path), config='--psm 3')
        
        # Pass 2: Sparse/Receipt focused if pass 1 was poor (PSM 11)
        if len(tess_text.strip()) < 20:
            print("🔄 Pass 2: Sparse text mode (PSM 11)...")
            tess_text += "\n" + pytesseract.image_to_string(Image.open(proc_path), config='--psm 11')

        # Pass 3: Raw image fallback
        if len(tess_text.strip()) < 10:
            tess_text = pytesseract.image_to_string(Image.open(file_path))
        
        if len(tess_text) > 10:
            text = tess_text
            ocr_method = "tesseract_multi"
            confidence = 0.6

            # AI Enhancement for fallback text
            from services.gemini_ai import extract_expense_from_text
            tess_ai_data = await extract_expense_from_text(tess_text)
            if tess_ai_data and tess_ai_data.get('amount'):
                extracted_data = tess_ai_data
                ocr_method += "+ai"
                confidence = 0.75
            else:
                # Last resort: Regex templates
                tess_template_data = extract_with_templates(tess_text)
                if tess_template_data:
                    extracted_data = tess_template_data
                    ocr_method += "+template"
                    confidence = 0.65

    result = {
        "text": text,
        "ocrMethod": ocr_method,
        "extractedData": extracted_data,
        "confidence": confidence
    }
    
    cache[ckey] = result
    save_ocr_cache(cache)
    return result

async def save_image(user_phone, media_id, mime_type, file_path, doc_type="image"):
    print(f"🔍 Processing image: {file_path}")
    ocr_result = await process_image_with_ocr(file_path, mime_type)
    
    # Save to documents table
    from services.documents import save_document
    await save_document(user_phone, media_id, os.path.basename(file_path), file_path, mime_type, doc_type, ocr_result)
    
    # If it's an expense, insert to expenses table
    if ocr_result["extractedData"]:
        await insert_expenses(user_phone, [ocr_result["extractedData"]], "ocr", file_path)
        
    return ocr_result
