import os
import cv2
import numpy as np
import fitz # PyMuPDF
import re

# Suppress PaddleOCR connectivity checks
os.environ["DISABLE_MODEL_SOURCE_CHECK"] = "True"

_paddle_ocr = None

def get_paddle_ocr():
    global _paddle_ocr
    if _paddle_ocr is None:
        try:
            from paddleocr import PaddleOCR
            # Robust init
            _paddle_ocr = PaddleOCR(use_angle_cls=True, lang='ar', use_gpu=False, show_log=False)
        except Exception as e:
            print(f"⚠️ PaddleOCR init failed: {e}, attempting simple...")
            try:
                from paddleocr import PaddleOCR
                _paddle_ocr = PaddleOCR(lang='ar')
            except:
                print("❌ All PaddleOCR init failed")
                _paddle_ocr = None
    return _paddle_ocr

def render_pdf_to_images(pdf_path):
    output_images = []
    temp_dir = "uploads/pdf_pages"
    os.makedirs(temp_dir, exist_ok=True)
    
    doc = fitz.open(pdf_path)
    for i in range(len(doc)):
        page = doc[i]
        pix = page.get_pixmap(matrix=fitz.Matrix(300/72, 300/72))
        img_path = os.path.join(temp_dir, f"{os.path.basename(pdf_path)}_{i}.png")
        pix.save(img_path)
        output_images.append(img_path)
    doc.close()
    return output_images

def preprocess_image(image_path):
    img = cv2.imread(image_path)
    if img is None: return image_path
    
    # Simple effective preprocess
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)
    denoised = cv2.fastNlMeansDenoising(enhanced, None, 10, 7, 21)
    
    proc_path = f"uploads/preprocessed/proc_{os.path.basename(image_path)}"
    os.makedirs("uploads/preprocessed", exist_ok=True)
    cv2.imwrite(proc_path, denoised)
    return proc_path

def ocr_paddle(image_path):
    ocr = get_paddle_ocr()
    if not ocr:
        return {"raw_text": "", "tokens": [], "ocr_confidence": 0.0}
        
    try:
        result = ocr.ocr(image_path, cls=True)
    except:
        result = ocr.ocr(image_path)
        
    if not result or not result[0]:
        return {"raw_text": "", "tokens": [], "ocr_confidence": 0.0}
        
    text_lines = []
    confidences = []
    tokens = []
    
    for line in result[0]:
        t = ""
        c = 0.0
        
        # Robust parsing of PaddleOCR output
        if len(line) >= 2:
            content = line[1]
            if isinstance(content, (list, tuple)) and len(content) >= 2:
                t = content[0]
                c = content[1]
            elif isinstance(content, str):
                # Edge case where only text is returned
                t = content
                c = 0.99
                
        if t:
            tokens.append({"text": t, "confidence": c, "bbox": line[0]})
            text_lines.append(t)
            confidences.append(c)
        
    return {
        "raw_text": "\n".join(text_lines),
        "tokens": tokens,
        "ocr_confidence": sum(confidences)/len(confidences) if confidences else 0.0
    }
