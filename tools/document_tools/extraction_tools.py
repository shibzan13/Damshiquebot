import re
import json
import base64
import os
from google import genai
from google.genai import types
from datetime import datetime
from typing import Dict, Any, Optional, List, Union
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Gemini Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.0-flash"
MAX_RETRIES = 3
REQUEST_TIMEOUT = 30  # seconds

# Global Client
client = None

def get_gemini_client():
    global client, GEMINI_API_KEY
    if not GEMINI_API_KEY:
        GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
    if not GEMINI_API_KEY:
        logger.warning("Gemini API key not configured")
        return None
        
    if not client:
        try:
            client = genai.Client(api_key=GEMINI_API_KEY)
            logger.info("Gemini Client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini Client: {e}")
            return None
    return client

def extract_candidates(text: str) -> Dict[str, Any]:
    """
    Extract structured data candidates from raw text.
    """
    if not text or not isinstance(text, str):
        return {
            "amounts": [],
            "dates": [],
            "merchants": [],
            "language_hint": "english"
        }
    
    amounts = []
    amount_patterns = [
        r'\b(?:AED|SAR|USD|EUR|GBP|€|£|\$)?\s*(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?|\d+\.\d{2})\b',
        r'\b(?:AED|SAR|USD|EUR|GBP|€|£|\$)?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+,\d{2})\b',
    ]
    
    for pattern in amount_patterns:
        for m in re.finditer(pattern, text):
            val = m.group(1).replace(',', '').replace(' ', '').replace('.', '').replace(',', '.')
            try:
                amount = float(val)
                if 0 < amount < 1000000:
                    amounts.append(amount)
            except (ValueError, AttributeError):
                continue
    
    dates = []
    date_patterns = [
        r'\b(\d{4}[-/\\.](0?[1-9]|1[0-2])[-/\\.](0?[1-9]|[12][0-9]|3[01]))\b',
        r'\b((0?[1-9]|[12][0-9]|3[01])[-/\\.](0?[1-9]|1[0-2])[-/\\.]\d{2,4})\b',
        r'\b(0?[1-9]|1[0-2])[-/\\.](0?[1-9]|[12][0-9]|3[01])[-/\\.]\d{2,4}\b',
    ]
    
    for pattern in date_patterns:
        for m in re.finditer(pattern, text):
            dates.append(m.group(0))
    
    merchants = []
    for line in text.split('\n'):
        line = line.strip()
        if len(line) > 2 and not any(c.isdigit() for c in line[:10]):
            merchants.append(line)
            if len(merchants) >= 5:
                break
    
    has_arabic = any(re.search(r'[\u0600-\u06FF]', line) for line in text.split('\n'))
    
    return {
        "amounts": sorted(list(set(amounts)), reverse=True),
        "dates": list(set(dates)),
        "merchants": merchants[:5],
        "language_hint": "arabic" if has_arabic else "english"
    }

async def gemini_structured_extract(
    raw_text: str, 
    candidates: Dict[str, Any], 
    doc_path: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Extract structured expense data using Gemini AI (New SDK).
    """
    client = get_gemini_client()
    if not client:
        return None
    
    system_prompt = """You are an expert at extracting financial information from documents. 
    Extract the following details from the provided text or document:
    - Merchant name (most prominent business name)
    - Total amount (look for TOTAL, GRAND TOTAL, or similar)
    - Subtotal (amount before tax)
    - Tax amount (sum of all taxes or total tax)
    - Currency (AED, USD, EUR, etc.)
    - Transaction date (in YYYY-MM-DD format)
    - Category (select from the provided list)
    - Confidence score (0.0-1.0)
    - Line items (array of objects with: description, quantity, unit_price, tax, line_total)
    
    Rules:
    1. Always return valid JSON matching the schema exactly
    2. If a field can't be determined, use null
    3. For dates, use YYYY-MM-DD format
    4. For amounts, use numbers only (no currency symbols)
    5. For confidence, estimate how certain you are (0.0-1.0)
    6. If line items are visible, extract as many as possible. If not, return an empty array.
    7. Calculate line_total if missing (quantity * unit_price + tax).
    
    Example Response:
    {
        "merchant": "Starbucks",
        "amount": 25.50,
        "subtotal": 24.29,
        "tax_amount": 1.21,
        "currency": "AED",
        "date": "2025-12-21",
        "category": "Food & Dining",
        "confidence": 0.95,
        "line_items": [
           {"description": "Caffe Latte", "quantity": 1, "unit_price": 24.29, "tax": 1.21, "line_total": 25.50}
        ],
        "notes": "Extracted from receipt"
    }"""
    
    user_prompt = f"""Extract expense information from the following text:
    
    === TEXT START ===
    {raw_text}
    === TEXT END ===
    
    Pre-extracted candidates:
    {json.dumps(candidates, indent=2)}
    
    Please provide the extracted information in the specified JSON format."""
    
    contents = []
    
    if doc_path and os.path.exists(doc_path):
        mime_type = "application/pdf" if doc_path.lower().endswith(".pdf") else "image/jpeg"
        try:
            with open(doc_path, "rb") as f:
                file_data = f.read()
                contents.append(types.Content(
                    role="user",
                    parts=[
                        types.Part.from_bytes(data=file_data, mime_type=mime_type),
                        types.Part.from_text(text=user_prompt)
                    ]
                ))
        except Exception as e:
            logger.warning(f"Could not load file for vision: {e}")
            contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_prompt)]))
    else:
         contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_prompt)]))

    config = types.GenerateContentConfig(
        temperature=0.2,
        top_p=0.95,
        top_k=40,
        max_output_tokens=1024,
        system_instruction=system_prompt,
    )
    
    try:
        for attempt in range(MAX_RETRIES):
            try:
                response = await client.aio.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=contents,
                    config=config
                )
                
                response_text = response.text.strip()
                logger.debug(f"Gemini raw response: {response_text}")
                
                json_match = re.search(r'\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}', response_text, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group(0))
                    
                    required_fields = ["merchant", "amount", "currency", "date", "category"]
                    if all(field in result for field in required_fields):
                        result["confidence"] = min(1.0, max(0.0, float(result.get("confidence", 0.5))))
                        return result
                    
            except (json.JSONDecodeError, KeyError) as e:
                logger.warning(f"JSON parsing error (attempt {attempt + 1}/{MAX_RETRIES}): {e}")
            except Exception as e:
                logger.error(f"Gemini API error (attempt {attempt + 1}/{MAX_RETRIES}): {e}")
                
    except Exception as e:
        logger.error(f"Error in gemini_structured_extract: {e}", exc_info=True)
    
    return None

def normalize_extraction(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Step 3: Normalize extraction output.
    Ensures mathematical consistency and status tracking.
    """
    if not result:
        return {}
    
    # 1. Header Normalization
    normalized = {
        "vendor_name": result.get("merchant", "Unknown"),
        "invoice_date": result.get("date"),
        "currency": result.get("currency", "AED"),
        "total_amount": float(result.get("amount") or 0),
        "tax_amount": float(result.get("tax_amount") or 0),
        "subtotal": float(result.get("subtotal") or 0),
        "confidence_score": float(result.get("confidence") or 0.5),
        "line_items": [],
        "line_items_status": "unavailable"
    }

    # 2. Line Items Normalization
    raw_items = result.get("line_items", [])
    if isinstance(raw_items, list) and len(raw_items) > 0:
        for item in raw_items:
            qty = float(item.get("quantity") or 1)
            up = float(item.get("unit_price") or 0)
            tax = float(item.get("tax") or 0)
            
            # Calculate line_total if missing
            lt = item.get("line_total")
            if lt is None or lt == 0:
                lt = (qty * up) + tax
            else:
                lt = float(lt)
                
            normalized["line_items"].append({
                "description": item.get("description", "Item"),
                "quantity": qty,
                "unit_price": up,
                "tax": tax,
                "line_total": lt
            })
        
        normalized["line_items_status"] = "extracted"
    
    # Edge case: If subtotal is missing but total and tax are present
    if normalized["subtotal"] == 0 and normalized["total_amount"] > 0:
        normalized["subtotal"] = normalized["total_amount"] - normalized["tax_amount"]
        
    return normalized

def deterministic_parse(raw_text: str, candidates: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fallback parser when AI extraction fails.
    """
    if not candidates or not isinstance(candidates, dict):
        candidates = {
            "amounts": [],
            "dates": [],
            "merchants": [],
            "language_hint": "english"
        }
    
    merchant = "Unknown"
    if candidates.get("merchants"):
        merchant = candidates["merchants"][0]
    else:
        for line in raw_text.split('\n'):
            line = line.strip()
            if line and len(line) > 2 and not line[0].isdigit():
                merchant = line
                break
    
    amount = 0.0
    if candidates.get("amounts"):
        amount = max(candidates["amounts"])
    
    date = datetime.now().strftime("%Y-%m-%d")
    if candidates.get("dates"):
        for date_str in candidates["dates"]:
            try:
                for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
                    try:
                        dt = datetime.strptime(date_str, fmt)
                        date = dt.strftime("%Y-%m-%d")
                        break
                    except ValueError:
                        continue
            except (ValueError, TypeError):
                continue
    
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
        "merchant": merchant[:100],
        "amount": float(amount) if amount else 0.0,
        "currency": "AED",
        "date": date,
        "category": category,
        "confidence": 0.3,
        "notes": "Extracted using fallback parser"
    }

def validate_expense(
    expense: Dict[str, Any], 
    raw_text: str, 
    candidates: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Validate the extracted expense data.
    """
    if not expense or not isinstance(expense, dict):
        return {
            "status": "FAIL", 
            "confidence": 0.0, 
            "reason": "invalid_expense_format",
            "details": "Expense data is missing or invalid"
        }
    
    required_fields = ["merchant", "amount", "currency", "date"]
    missing_fields = [field for field in required_fields if field not in expense or not expense[field]]
    
    if missing_fields:
        return {
            "status": "FAIL",
            "confidence": 0.0,
            "reason": "missing_required_fields",
            "details": f"Missing required fields: {', '.join(missing_fields)}"
        }
    
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
    
    date_str = expense.get("date", "")
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
        return {
            "status": "FAIL",
            "confidence": 0.0,
            "reason": "invalid_date_format",
            "details": f"Date must be in YYYY-MM-DD format, got {date_str}"
        }
    
    confidence = min(1.0, max(0.0, float(expense.get("confidence", 0.5))))
    
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

async def generate_embedding(text: str) -> List[float]:
    """
    Generate embedding for semantic search using Gemini.
    """
    client = get_gemini_client()
    if not client or not text:
        return []
    
    try:
        # Truncate text if too long (approx char limit for embedding models is often ~10k-30k chars, but let's be safe)
        safe_text = text[:8000] 
        
        response = await client.aio.models.embed_content(
            model="models/text-embedding-004",
            contents=safe_text
        )
        # Verify dimension
        embedding = response.embeddings[0].values
        if len(embedding) == 768:
            return embedding
        else:
            logger.warning(f"Unexpected embedding dimension: {len(embedding)}")
            return []
            
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return []
