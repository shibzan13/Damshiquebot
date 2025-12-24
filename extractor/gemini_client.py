"""
Gemini Client for Structuring - Best effort enhancement
Calls Gemini to select from candidates and structure output
"""

import google.generativeai as genai
import os
import json
import time
from typing import Optional, Dict

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.0-flash"

# Rate limiting
last_call_time = 0
MIN_CALL_INTERVAL = 1.0  # seconds

import base64

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

async def call_gemini_for_structuring(
    ocr_text: str,
    amount_candidates: list,
    date_candidates: list,
    merchant_candidates: list,
    doc_path: Optional[str] = None,
    timeout: float = 60.0
) -> Optional[Dict]:
    """
    Call Gemini (Vision + Text) to structure expense data
    
    Returns dict or None on failure
    """
    global last_call_time
    
    if not GEMINI_API_KEY:
        print("⚠️ Gemini not configured, skipping")
        return None
    
    # Rate limiting
    elapsed = time.time() - last_call_time
    if elapsed < MIN_CALL_INTERVAL:
        time.sleep(MIN_CALL_INTERVAL - elapsed)
    
    try:
        # Truncate OCR text
        ocr_text_truncated = ocr_text[:6000] if len(ocr_text) > 6000 else ocr_text
        
        # Format candidates
        amount_candidates_json = json.dumps(amount_candidates[:5], indent=2)
        date_candidates_json = json.dumps(date_candidates[:3], indent=2)
        merchant_candidates_json = json.dumps(merchant_candidates[:3], indent=2)
        
        prompt = f"""You are an expert expense extractor. You have been provided with an OCR transcript and potentially an image of a receipt/invoice.
        
Your task is to extract the exact merchant, total amount, currency, date, and category.

OCR_TEXT:
<<<{ocr_text_truncated}>>>

DETERMINISTIC CANDIDATES (Use these as hints, but use your vision to confirm the truth):
- AMOUNTS: {amount_candidates_json}
- DATES: {date_candidates_json}
- MERCHANTS: {merchant_candidates_json}

RULES:
1. MERCHANT: The name of the business.
2. AMOUNT: The GRAND TOTAL or TOTAL AMOUNT DUE. Avoid TAX, CHANGE, or SUBTOTAL.
3. CURRENCY: 3-letter code (AED, GBP, etc).
4. DATE: YYYY-MM-DD.
5. CATEGORY: Groceries, Food & Dining, Transport, Utilities, Shopping, Entertainment, Health, Services, Travel, Other.

Return ONLY a valid JSON object:
{{
  "merchant": "name",
  "amount": 123.45,
  "currency": "AED",
  "date": "YYYY-MM-DD",
  "category": "...",
  "items": [],
  "language": "arabic|english|both",
  "confidence": 0.0-1.0,
  "notes": "..."
}}"""

        model = genai.GenerativeModel(GEMINI_MODEL)
        
        inputs = [prompt]
        if doc_path and os.path.exists(doc_path):
            # Detect mime type from file extension
            mime_type = "image/jpeg"
            ext = doc_path.lower().split('.')[-1]
            if ext == 'pdf':
                mime_type = "application/pdf"
                print(f"📄 Gemini using PDF native extraction...")
            elif ext == 'png':
                mime_type = "image/png"
                print(f"👁️ Gemini using Vision for structuring...")
            else:
                print(f"👁️ Gemini using Vision (JPG) for structuring...")

            with open(doc_path, "rb") as f:
                doc_data = f.read()
                inputs.append({
                    "mime_type": mime_type,
                    "data": base64.b64encode(doc_data).decode()
                })

        response = await model.generate_content_async(
            inputs,
            generation_config=genai.GenerationConfig(
                temperature=0.1,
                max_output_tokens=1000,
            ),
            request_options={"timeout": timeout}
        )
        
        last_call_time = time.time()
        
        if not response or not response.text:
            return None
        
        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        start = text.find("{")
        end = text.rfind("}") + 1
        
        if start < 0 or end <= start:
            return None
        
        result = json.loads(text[start:end])
        return result
        
    except Exception as e:
        print(f"⚠️ Gemini API error: {e}")
        return None
