import re
import json
import base64
import os
import google.generativeai as genai
from datetime import datetime
from typing import Dict, Any, Optional, List, Union
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Gemini Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-1.5-pro"  # Updated to latest model
MAX_RETRIES = 3
REQUEST_TIMEOUT = 30  # seconds

# Configure Gemini
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("Gemini API configured successfully")
    except Exception as e:
        logger.error(f"Failed to configure Gemini: {e}")

def extract_candidates(text: str) -> Dict[str, Any]:
    """
    Extract structured data candidates from raw text.
    
    Args:
        text: Raw text from OCR or document
        
    Returns:
        Dictionary containing extracted candidates
    """
    if not text or not isinstance(text, str):
        return {
            "amounts": [],
            "dates": [],
            "merchants": [],
            "language_hint": "english"
        }
    
    # Extract amounts (supports various formats like 1,000.00, 1.000,00, etc.)
    amounts = []
    amount_patterns = [
        r'\b(?:AED|SAR|USD|EUR|GBP|€|£|\$)?\s*(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?|\d+\.\d{2})\b',  # 1,000.00 or 1000.00
        r'\b(?:AED|SAR|USD|EUR|GBP|€|£|\$)?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+,\d{2})\b',  # 1.000,00
    ]
    
    for pattern in amount_patterns:
        for m in re.finditer(pattern, text):
            val = m.group(1).replace(',', '').replace(' ', '').replace('.', '').replace(',', '.')
            try:
                amount = float(val)
                if 0 < amount < 1000000:  # Reasonable amount range
                    amounts.append(amount)
            except (ValueError, AttributeError):
                continue
    
    # Extract dates (multiple formats)
    dates = []
    date_patterns = [
        r'\b(\d{4}[-/\\.](0?[1-9]|1[0-2])[-/\\.](0?[1-9]|[12][0-9]|3[01]))\b',  # YYYY-MM-DD
        r'\b((0?[1-9]|[12][0-9]|3[01])[-/\\.](0?[1-9]|1[0-2])[-/\\.]\d{2,4})\b',  # DD-MM-YYYY or DD/MM/YYYY
        r'\b(0?[1-9]|1[0-2])[-/\\.](0?[1-9]|[12][0-9]|3[01])[-/\\.]\d{2,4}\b',  # MM-DD-YYYY or MM/DD/YYYY
    ]
    
    for pattern in date_patterns:
        for m in re.finditer(pattern, text):
            dates.append(m.group(0))
    
    # Extract potential merchant names (first few non-empty lines)
    merchants = []
    for line in text.split('\n'):
        line = line.strip()
        if len(line) > 2 and not any(c.isdigit() for c in line[:10]):
            merchants.append(line)
            if len(merchants) >= 5:  # Limit to top 5 candidates
                break
    
    # Detect language (Arabic or English)
    has_arabic = any(re.search(r'[\u0600-\u06FF]', line) for line in text.split('\n'))
    
    return {
        "amounts": sorted(list(set(amounts)), reverse=True),  # Sort amounts descending
        "dates": list(set(dates)),
        "merchants": merchants[:5],  # Limit to 5 merchants
        "language_hint": "arabic" if has_arabic else "english"
    }

async def gemini_structured_extract(
    raw_text: str, 
    candidates: Dict[str, Any], 
    doc_path: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Extract structured expense data using Gemini AI.
    
    Args:
        raw_text: Raw text from OCR or document
        candidates: Dictionary of pre-extracted candidates
        doc_path: Optional path to the original document for multi-modal processing
        
    Returns:
        Dictionary containing structured expense data or None if extraction fails
    """
    global GEMINI_API_KEY
    
    # Initialize Gemini API if not already done
    if not GEMINI_API_KEY:
        GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        if GEMINI_API_KEY:
            try:
                genai.configure(api_key=GEMINI_API_KEY)
                logger.info("Gemini API configured successfully")
            except Exception as e:
                logger.error(f"Failed to configure Gemini: {e}")
                return None
    
    if not GEMINI_API_KEY:
        logger.warning("Gemini API key not configured")
        return None
    
    # Prepare the system prompt
    system_prompt = """You are an expert at extracting financial information from documents. 
    Extract the following details from the provided text or document:
    - Merchant name (most prominent business name)
    - Total amount (look for TOTAL, GRAND TOTAL, or similar)
    - Currency (AED, USD, EUR, etc.)
    - Transaction date (in YYYY-MM-DD format)
    - Category (select from the provided list)
    - Confidence score (0.0-1.0)
    
    Rules:
    1. Always return valid JSON matching the schema exactly
    2. If a field can't be determined, use null
    3. For dates, use YYYY-MM-DD format
    4. For amounts, use numbers only (no currency symbols)
    5. For confidence, estimate how certain you are (0.0-1.0)
    
    Example Response:
    {
        "merchant": "Starbucks",
        "amount": 25.50,
        "currency": "AED",
        "date": "2025-12-21",
        "category": "Food & Dining",
        "confidence": 0.95,
        "notes": "Extracted from receipt"
    }"""
    
    # Prepare the user prompt with context
    user_prompt = f"""Extract expense information from the following text:
    
    === TEXT START ===
    {raw_text}
    === TEXT END ===
    
    Pre-extracted candidates:
    {json.dumps(candidates, indent=2)}
    
    Please provide the extracted information in the specified JSON format."""
    
    # Configure the model with safety settings
    generation_config = {
        "temperature": 0.2,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 1024,
    }
    
    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
    ]
    
    try:
        # Initialize the model
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        # Prepare the content parts
        content_parts = [user_prompt]
        
        # Add document if provided
        if doc_path and os.path.exists(doc_path):
            mime_type = "application/pdf" if doc_path.lower().endswith(".pdf") else "image/jpeg"
            with open(doc_path, "rb") as f:
                file_data = f.read()
                content_parts.append({
                    "mime_type": mime_type,
                    "data": base64.b64encode(file_data).decode()
                })
        
        # Generate the response with retries
        for attempt in range(MAX_RETRIES):
            try:
                response = await model.generate_content_async(
                    content_parts,
                    generation_config=generation_config,
                    safety_settings=safety_settings,
                    request_options={"timeout": REQUEST_TIMEOUT}
                )
                
                # Extract JSON from response
                response_text = response.text.strip()
                logger.debug(f"Gemini raw response: {response_text}")
                
                # Try to find JSON in the response
                json_match = re.search(r'\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}', response_text, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group(0))
                    
                    # Validate required fields
                    required_fields = ["merchant", "amount", "currency", "date", "category"]
                    if all(field in result for field in required_fields):
                        # Ensure confidence is a float between 0 and 1
                        result["confidence"] = min(1.0, max(0.0, float(result.get("confidence", 0.5))))
                        return result
                    
                if attempt < MAX_RETRIES - 1:
                    logger.warning(f"Retry {attempt + 1}/{MAX_RETRIES} - Invalid JSON format in response")
                    continue
                    
            except (json.JSONDecodeError, KeyError) as e:
                logger.warning(f"JSON parsing error (attempt {attempt + 1}/{MAX_RETRIES}): {e}")
                if attempt == MAX_RETRIES - 1:
                    logger.error(f"Failed to parse Gemini response after {MAX_RETRIES} attempts")
            except Exception as e:
                logger.error(f"Gemini API error (attempt {attempt + 1}/{MAX_RETRIES}): {e}")
                if attempt == MAX_RETRIES - 1:
                    logger.error(f"Gemini API failed after {MAX_RETRIES} attempts")
    
    except Exception as e:
        logger.error(f"Error in gemini_structured_extract: {e}", exc_info=True)
    
    return None

def deterministic_parse(raw_text: str, candidates: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fallback parser when AI extraction fails.
    
    Args:
        raw_text: Raw text from OCR or document
        candidates: Pre-extracted candidates
        
    Returns:
        Dictionary with best-guess expense data
    """
    if not candidates or not isinstance(candidates, dict):
        candidates = {
            "amounts": [],
            "dates": [],
            "merchants": [],
            "language_hint": "english"
        }
    
    # Get the most likely merchant (first non-empty line or first merchant candidate)
    merchant = "Unknown"
    if candidates.get("merchants"):
        merchant = candidates["merchants"][0]
    else:
        for line in raw_text.split('\n'):
            line = line.strip()
            if line and len(line) > 2 and not line[0].isdigit():
                merchant = line
                break
    
    # Get the largest amount (most likely the total)
    amount = 0.0
    if candidates.get("amounts"):
        amount = max(candidates["amounts"])
    
    # Try to get a date from candidates or use today's date
    date = datetime.now().strftime("%Y-%m-%d")
    if candidates.get("dates"):
        # Try to parse the first date
        for date_str in candidates["dates"]:
            try:
                # Try different date formats
                for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
                    try:
                        dt = datetime.strptime(date_str, fmt)
                        date = dt.strftime("%Y-%m-%d")
                        break
                    except ValueError:
                        continue
            except (ValueError, TypeError):
                continue
    
    # Simple category detection based on merchant name
    category = "Other"
    merchant_lower = merchant.lower()
    category_keywords = {
        "Groceries": ["carrefour", "lulu", "spinneys", "waitrose", "geant", "choithrams"],
        "Food & Dining": ["restaurant", "cafe", "starbucks", "mcdonalds", "kfc", "food", "eat", "dine"],
        "Transport": ["taxi", "uber", "careem", "petrol", "adnoc", "enoc", "rta", "transport"],
        "Utilities": ["etisalat", "du", "dewa", "fwe", "acwa", "utility", "internet", "phone"],
        "Shopping": ["mall", "centre", "store", "shop", "retail", "fashion", "clothes"],
        "Entertainment": ["cinema", "movie", "vox", "reel", "novo", "entertain", "game"],
        "Health": ["pharmacy", "hospital", "clinic", "doctor", "medical", "wellness"],
        "Travel": ["emirates", "etihad", "flydubai", "airport", "hotel", "holiday"],
    }
    
    for cat, keywords in category_keywords.items():
        if any(keyword in merchant_lower for keyword in keywords):
            category = cat
            break
    
    return {
        "merchant": merchant[:100],  # Limit length
        "amount": float(amount) if amount else 0.0,
        "currency": "AED",  # Default to AED
        "date": date,
        "category": category,
        "confidence": 0.3,  # Low confidence since this is a fallback
        "notes": "Extracted using fallback parser"
    }

def validate_expense(
    expense: Dict[str, Any], 
    raw_text: str, 
    candidates: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Validate the extracted expense data.
    
    Args:
        expense: Extracted expense data
        raw_text: Original text for reference
        candidates: Pre-extracted candidates
        
    Returns:
        Dictionary with validation status and details
    """
    if not expense or not isinstance(expense, dict):
        return {
            "status": "FAIL", 
            "confidence": 0.0, 
            "reason": "invalid_expense_format",
            "details": "Expense data is missing or invalid"
        }
    
    # Check required fields
    required_fields = ["merchant", "amount", "currency", "date"]
    missing_fields = [field for field in required_fields if field not in expense or not expense[field]]
    
    if missing_fields:
        return {
            "status": "FAIL",
            "confidence": 0.0,
            "reason": "missing_required_fields",
            "details": f"Missing required fields: {', '.join(missing_fields)}"
        }
    
    # Validate amount
    try:
        amount = float(expense["amount"])
        if amount <= 0:
            return {
                "status": "FAIL",
                "confidence": 0.0,
                "reason": "invalid_amount",
                "details": f"Amount must be greater than 0, got {amount}"
            }
    except (ValueError, TypeError):
        return {
            "status": "FAIL",
            "confidence": 0.0,
            "reason": "invalid_amount_format",
            "details": f"Amount must be a number, got {expense['amount']}"
        }
    
    # Validate date format (YYYY-MM-DD)
    date_str = expense.get("date", "")
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
        return {
            "status": "FAIL",
            "confidence": 0.0,
            "reason": "invalid_date_format",
            "details": f"Date must be in YYYY-MM-DD format, got {date_str}"
        }
    
    # Get confidence from expense or calculate based on validations
    confidence = min(1.0, max(0.0, float(expense.get("confidence", 0.5))))
    
    # Determine status based on confidence and validations
    if confidence >= 0.8 and all(field in expense for field in required_fields):
        status = "PASS"
    elif confidence >= 0.5:
        status = "NEEDS_REVIEW"
    else:
        status = "FAIL"
    
    return {
        "status": status,
        "confidence": confidence,
        "reason": "" if status == "PASS" else "low_confidence",
        "details": "Expense validated successfully" if status == "PASS" else "Expense needs review"
    }
