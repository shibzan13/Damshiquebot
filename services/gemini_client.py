"""
Gemini API Client (Official Python SDK)
Production-grade implementation with proper fallback chain
"""

import google.generativeai as genai
import os
import time
import json
from typing import Optional, Dict, Any
import base64

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_PRIMARY_MODEL = "gemini-2.0-flash"
GEMINI_FALLBACK_MODEL = "gemini-2.0-flash"

# Circuit breaker for rate limiting
last_429_time = 0
BREAKER_COOLDOWN = 60  # seconds

# Model selection tracking
current_model = GEMINI_PRIMARY_MODEL

def init_gemini():
    """Initialize Gemini API"""
    if not GEMINI_API_KEY:
        print("⚠️ GEMINI_API_KEY not set - Gemini OCR will be skipped")
        return False
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        print(f"✅ Gemini API initialized")
        print(f"   Primary model: {GEMINI_PRIMARY_MODEL}")
        print(f"   Fallback model: {GEMINI_FALLBACK_MODEL}")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize Gemini: {e}")
        return False

def is_gemini_available():
    """Check if Gemini is configured"""
    return GEMINI_API_KEY is not None

async def _call_gemini_with_fallback(prompt: str, image_data: Optional[bytes] = None, mime_type: str = "image/jpeg") -> Optional[str]:
    """
    Internal helper to call Gemini with automatic Pro -> Flash fallback
    Returns raw text response or None on failure
    """
    global last_429_time, current_model
    
    # Check circuit breaker
    if time.time() - last_429_time < BREAKER_COOLDOWN:
        remaining = int(BREAKER_COOLDOWN - (time.time() - last_429_time))
        print(f"🕒 Gemini circuit breaker active: {remaining}s remaining")
        return None
    
    # Try primary model first, then fallback
    models_to_try = [GEMINI_PRIMARY_MODEL, GEMINI_FALLBACK_MODEL]
    
    for model_name in models_to_try:
        try:
            print(f"🤖 Attempting Gemini model: {model_name}")
            model = genai.GenerativeModel(model_name)
            
            if image_data:
                # Vision mode
                image_part = {
                    "mime_type": mime_type,
                    "data": base64.b64encode(image_data).decode()
                }
                response = await model.generate_content_async([prompt, image_part])
            else:
                # Text-only mode
                response = await model.generate_content_async(prompt)
            
            # Success
            current_model = model_name
            print(f"✅ Gemini response received from {model_name}")
            return response.text
            
        except Exception as e:
            error_msg = str(e)
            
            # Handle rate limiting
            if "429" in error_msg or "quota" in error_msg.lower() or "resource_exhausted" in error_msg.lower():
                last_429_time = time.time()
                print(f"⚠️ Gemini rate limit hit on {model_name}. Cooldown: {BREAKER_COOLDOWN}s")
                return None  # Don't try fallback on rate limit
            
            # Log error and try next model
            print(f"⚠️ Gemini {model_name} failed: {error_msg}")
            
            # If this was the last model, return None
            if model_name == models_to_try[-1]:
                print(f"❌ All Gemini models failed. Falling back to PaddleOCR.")
                return None
            
            # Otherwise, continue to fallback model
            print(f"   Falling back to {GEMINI_FALLBACK_MODEL}...")
    
    return None

async def classify_document_with_gemini(file_path: str, is_image: bool = True) -> Optional[Dict[str, Any]]:
    """
    Classify document and extract expense data using Gemini Vision
    
    IMPORTANT: This function ONLY extracts/classifies data.
    It NEVER confirms system actions (like "cleared expenses").
    All destructive actions must be verified in backend storage.
    
    Returns:
        Dict with classification and extracted_fields, or None on failure
    """
    if not is_gemini_available():
        print("⚠️ Gemini not available, skipping to PaddleOCR")
        return None
    
    try:
        prompt = """Analyze this invoice/receipt and extract key information.

Return ONLY a JSON object with this exact structure:
{
  "document_type": "invoice|receipt|other",
  "document_category": "category name",
  "confidence": 0.0-1.0,
  "language": "arabic|english|both",
  "extracted_fields": {
    "merchant": "business name",
    "amount": 123.45,
    "currency": "AED",
    "date": "YYYY-MM-DD",
    "category": "Groceries|Food & Dining|Transport|Utilities|Shopping|Entertainment|Health|Services|Travel|Other",
    "items": []
  }
}

CRITICAL RULES:
- Find the TOTAL/GRAND TOTAL amount (not subtotals)
- Convert dates to YYYY-MM-DD format
- Default currency to AED if not specified
- Be conservative: only add data you're confident about
- DO NOT confirm any system actions
- ONLY extract data from the document"""

        image_data = None
        if is_image:
            # Read image file
            with open(file_path, 'rb') as f:
                image_data = f.read()
        
        # Call Gemini with fallback
        response_text = await _call_gemini_with_fallback(prompt, image_data, "image/jpeg")
        
        if not response_text:
            print("❌ Gemini returned no response, falling back to PaddleOCR")
            return None
        
        # Parse JSON from response
        text = response_text
        
        # Extract JSON from markdown code blocks if present
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        # Find JSON object
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            json_str = text[start:end]
            result = json.loads(json_str)
            
            confidence = result.get('confidence', 0)
            print(f"✅ Gemini classification successful")
            print(f"   Model used: {current_model}")
            print(f"   Confidence: {confidence*100:.1f}%")
            print(f"   Document type: {result.get('document_type', 'unknown')}")
            
            return result
        
        print("⚠️ Could not parse JSON from Gemini response, falling back to PaddleOCR")
        return None
        
    except Exception as e:
        # ANY exception returns None for PaddleOCR fallback
        print(f"❌ Gemini classification exception: {e}")
        print(f"   Falling back to PaddleOCR")
        return None

async def extract_expense_with_gemini(text: str, file_path: Optional[str] = None, is_image: bool = False) -> Optional[Dict[str, Any]]:
    """
    Extract expense data from text or image using Gemini
    
    IMPORTANT: This function ONLY extracts data.
    It NEVER confirms system actions.
    
    Returns:
        Dict with expense fields, or None on failure
    """
    if not is_gemini_available():
        print("⚠️ Gemini not available, skipping to PaddleOCR")
        return None
    
    try:
        prompt = f"""Extract expense information from this invoice/receipt.

{"Analyze the image and extract:" if is_image and file_path else f"TEXT:\n{text[:3000]}"}

Return ONLY a JSON object:
{{
  "merchant": "business name",
  "amount": 123.45,
  "currency": "AED",
  "date": "YYYY-MM-DD",
  "category": "Groceries|Food & Dining|Transport|Utilities|Shopping|Entertainment|Health|Services|Travel|Other",
  "items": ["item1", "item2"],
  "notes": "any special notes"
}}

CRITICAL:
- Find the TOTAL/GRAND TOTAL amount (not subtotals)
- Convert dates to YYYY-MM-DD format
- Default currency to AED if not specified
- Choose the most appropriate category
- DO NOT confirm any system actions
- ONLY extract data from the document"""

        image_data = None
        if is_image and file_path:
            with open(file_path, 'rb') as f:
                image_data = f.read()
        
        # Call Gemini with fallback
        response_text = await _call_gemini_with_fallback(prompt, image_data, "image/jpeg")
        
        if not response_text:
            print("❌ Gemini returned no response, falling back to PaddleOCR")
            return None
        
        # Extract JSON
        text = response_text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            json_str = text[start:end]
            result = json.loads(json_str)
            
            if result.get("amount"):
                print(f"✅ Gemini expense extraction successful")
                print(f"   Model used: {current_model}")
                print(f"   Merchant: {result.get('merchant', 'Unknown')}")
                print(f"   Amount: {result.get('currency', 'AED')} {result.get('amount', 0)}")
                return result
        
        print("⚠️ Could not parse expense from Gemini response, falling back to PaddleOCR")
        return None
        
    except Exception as e:
        # ANY exception returns None for PaddleOCR fallback
        print(f"❌ Gemini expense extraction exception: {e}")
        print(f"   Falling back to PaddleOCR")
        return None

