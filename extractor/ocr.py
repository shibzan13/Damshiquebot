"""
PaddleOCR Engine - Primary OCR
Handles Arabic + English mixed text
"""

import os
import cv2
import numpy as np
from typing import Dict, List, Optional, Tuple
from PIL import Image

# Lazy import PaddleOCR to avoid startup overhead
_paddle_ocr = None

def get_paddle_ocr():
    """Lazy initialize PaddleOCR"""
    global _paddle_ocr
    if _paddle_ocr is None:
        try:
            from paddleocr import PaddleOCR
            import os
            
            # Disable model source check to speed up initialization
            os.environ["DISABLE_MODEL_SOURCE_CHECK"] = "True"
            
            # Initialize with Arabic support
            # Some versions use different argument names, so we use a robust approach
            try:
                # Try with all options first
                _paddle_ocr = PaddleOCR(
                    use_angle_cls=True,
                    lang='ar',
                    use_gpu=False,
                    show_log=False
                )
            except Exception as e:
                print(f"⚠️ Initial PaddleOCR attempt failed with args, trying simple init: {e}")
                # Fallback to absolute minimum if anything goes wrong
                try:
                    _paddle_ocr = PaddleOCR(lang='ar')
                except Exception as e2:
                    print(f"❌ All PaddleOCR init attempts failed: {e2}")
                    _paddle_ocr = None
            
            if _paddle_ocr:
                print("✅ PaddleOCR initialized (Arabic + English)")
        except Exception as e:
            print(f"❌ PaddleOCR module error: {e}")
            _paddle_ocr = None
    return _paddle_ocr

def preprocess_image(image_path: str) -> str:
    """
    Optimized preprocessing for receipts
    - Contrast enhancement
    - Grayscale if needed
    - Deskewing
    Returns path to preprocessed image
    """
    try:
        img = cv2.imread(image_path)
        if img is None:
            return image_path
        
        # 1. Resize if too small (target ~2000px width for good OCR)
        height, width = img.shape[:2]
        if width < 1500:
            scale = 2000 / width
            img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        
        # 2. Grayscale (PaddleOCR works better with grayscale sometimes)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 3. Enhance contrast (CLAHE)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # Instead of aggressive thresholding, use denoised grayscale
        # This preserves faint text and colored backgrounds better
        denoised = cv2.fastNlMeansDenoising(enhanced, None, 10, 7, 21)
        
        # 4. Save preprocessed image
        output_dir = "uploads/preprocessed"
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"proc_{os.path.basename(image_path)}")
        cv2.imwrite(output_path, denoised)
        
        print(f"✅ Image preprocessed: {output_path}")
        return output_path
        
    except Exception as e:
        print(f"⚠️ Preprocessing failed: {e}, using original")
        return image_path

def run_paddleocr(image_path: str) -> Dict:
    """
    Run PaddleOCR on image
    Returns:
        {
            "raw_text": str,
            "tokens": List[Dict],  # [{text, confidence, bbox}]
            "avg_confidence": float,
            "success": bool,
            "error": str|None
        }
    """
    ocr = get_paddle_ocr()
    
    if ocr is None:
        return {
            "raw_text": "",
            "tokens": [],
            "avg_confidence": 0.0,
            "success": False,
            "error": "PaddleOCR not available"
        }
    
    try:
        # Preprocess image first
        processed_path = preprocess_image(image_path)
        
        # Run OCR
        try:
            result = ocr.ocr(processed_path, cls=True)
        except TypeError:
            # Fallback for versions that don't support 'cls' in ocr() call
            result = ocr.ocr(processed_path)
        
        if not result or not result[0]:
            return {
                "raw_text": "",
                "tokens": [],
                "avg_confidence": 0.0,
                "success": False,
                "error": "No text detected"
            }
        
        # Extract text and tokens
        tokens = []
        text_lines = []
        confidences = []
        
        for line in result[0]:
            bbox = line[0]  # Bounding box coordinates
            text_info = line[1]  # (text, confidence)
            text = text_info[0]
            confidence = text_info[1]
            
            tokens.append({
                "text": text,
                "confidence": confidence,
                "bbox": bbox
            })
            
            text_lines.append(text)
            confidences.append(confidence)
        
        raw_text = "\n".join(text_lines)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        print(f"✅ PaddleOCR: {len(tokens)} tokens, avg confidence: {avg_confidence:.2f}")
        
        return {
            "raw_text": raw_text,
            "tokens": tokens,
            "avg_confidence": avg_confidence,
            "success": True,
            "error": None
        }
        
    except Exception as e:
        print(f"❌ PaddleOCR error: {e}")
        return {
            "raw_text": "",
            "tokens": [],
            "avg_confidence": 0.0,
            "success": False,
            "error": str(e)
        }

def extract_text_from_pdf(pdf_path: str) -> Dict:
    """
    Convert PDF pages to images and run OCR
    Returns same structure as run_paddleocr but aggregated
    """
    try:
        import fitz  # PyMuPDF
        
        doc = fitz.open(pdf_path)
        all_text = []
        all_tokens = []
        all_confidences = []
        
        # Create temp directory for PDF page images
        temp_dir = "uploads/pdf_pages"
        os.makedirs(temp_dir, exist_ok=True)
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Render page to image at 300 DPI
            mat = fitz.Matrix(300/72, 300/72)
            pix = page.get_pixmap(matrix=mat)
            
            # Save as temporary image
            img_path = os.path.join(temp_dir, f"page_{page_num}.png")
            pix.save(img_path)
            
            # Run OCR on page
            ocr_result = run_paddleocr(img_path)
            
            if ocr_result["success"]:
                all_text.append(f"--- Page {page_num + 1} ---")
                all_text.append(ocr_result["raw_text"])
                all_tokens.extend(ocr_result["tokens"])
                all_confidences.append(ocr_result["avg_confidence"])
            
            # Clean up temp image
            try:
                os.remove(img_path)
            except:
                pass
        
        doc.close()
        
        if not all_text:
            return {
                "raw_text": "",
                "tokens": [],
                "avg_confidence": 0.0,
                "success": False,
                "error": "No text extracted from PDF"
            }
        
        return {
            "raw_text": "\n".join(all_text),
            "tokens": all_tokens,
            "avg_confidence": sum(all_confidences) / len(all_confidences) if all_confidences else 0.0,
            "success": True,
            "error": None
        }
        
    except Exception as e:
        print(f"❌ PDF OCR error: {e}")
        return {
            "raw_text": "",
            "tokens": [],
            "avg_confidence": 0.0,
            "success": False,
            "error": str(e)
        }
