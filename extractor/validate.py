"""
Validation and Confidence Scoring
Validates extracted data and computes final confidence score
"""

from typing import Dict, Optional, Tuple
from datetime import datetime
import re

# Valid categories
VALID_CATEGORIES = [
    "Groceries", "Food & Dining", "Transport", "Utilities",
    "Shopping", "Entertainment", "Health", "Services", "Travel", "Other"
]

# Valid currencies
VALID_CURRENCIES = ["AED", "GBP", "USD", "SAR", "QAR", "EUR"]

def validate_amount(amount: Optional[float], candidates: list) -> Tuple[bool, float, str]:
    """
    Validate amount field
    Returns: (is_valid, confidence_adjustment, reason)
    """
    if amount is None:
        return False, -0.5, "amount_missing"
    
    if not isinstance(amount, (int, float)):
        return False, -0.5, "amount_invalid_type"
    
    if amount <= 0:
        return False, -0.5, "amount_negative_or_zero"
    
    if amount > 1000000:
        return False, -0.3, "amount_unrealistic_high"
    
    # Check if amount matches a high-scoring candidate
    for candidate in candidates[:3]:
        if abs(candidate["value"] - amount) < 0.01:
            if candidate["score"] > 0.7:
                return True, 0.2, "amount_matches_high_confidence_candidate"
            else:
                return True, 0.0, "amount_matches_candidate"
    
    # Amount doesn't match candidates - could be Gemini extraction
    return True, -0.1, "amount_not_in_candidates"

def validate_date(date_str: Optional[str], candidates: list) -> Tuple[bool, float, str]:
    """
    Validate date field
    Returns: (is_valid, confidence_adjustment, reason)
    """
    if date_str is None:
        return True, -0.2, "date_missing"  # Not critical
    
    # Check format
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
        return False, -0.3, "date_invalid_format"
    
    # Parse date
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        return False, -0.3, "date_invalid_value"
    
    # Check reasonable range
    today = datetime.now()
    days_diff = (today - date_obj).days
    
    if days_diff < -30:  # More than 30 days in future
        return False, -0.4, "date_far_future"
    
    if days_diff > 365 * 5:  # More than 5 years old
        return True, -0.2, "date_very_old"
    
    # Check if matches candidate
    for candidate in candidates[:2]:
        if candidate["value"] == date_str:
            if candidate["score"] > 0.7:
                return True, 0.1, "date_matches_high_confidence_candidate"
            else:
                return True, 0.0, "date_matches_candidate"
    
    return True, -0.1, "date_not_in_candidates"

def validate_currency(currency: Optional[str], language: str) -> Tuple[bool, float, str]:
    """
    Validate currency field
    Returns: (is_valid, confidence_adjustment, reason)
    """
    if currency is None:
        # Default to AED if Arabic present
        if language in ["arabic", "both"]:
            return True, -0.1, "currency_defaulted_to_AED"
        else:
            return True, -0.2, "currency_missing"
    
    if currency not in VALID_CURRENCIES:
        return False, -0.3, f"currency_invalid:{currency}"
    
    return True, 0.1, "currency_valid"

def validate_merchant(merchant: Optional[str]) -> Tuple[bool, float, str]:
    """
    Validate merchant field
    Returns: (is_valid, confidence_adjustment, reason)
    """
    if merchant is None or not merchant.strip():
        return True, -0.2, "merchant_missing"  # Not critical
    
    merchant_clean = merchant.strip()
    
    # Check if it's just generic words
    generic_words = ["vat", "invoice", "receipt", "bill", "tax", "total"]
    if merchant_clean.lower() in generic_words:
        return False, -0.3, f"merchant_generic:{merchant_clean}"
    
    # Check reasonable length
    if len(merchant_clean) < 2:
        return False, -0.3, "merchant_too_short"
    
    if len(merchant_clean) > 100:
        return True, -0.1, "merchant_very_long"
    
    return True, 0.1, "merchant_valid"

def validate_category(category: Optional[str]) -> Tuple[bool, float, str]:
    """
    Validate category field
    Returns: (is_valid, confidence_adjustment, reason)
    """
    if category is None:
        return True, -0.1, "category_missing"  # Will default to "Other"
    
    if category not in VALID_CATEGORIES:
        return False, -0.2, f"category_invalid:{category}"
    
    return True, 0.05, "category_valid"

def compute_confidence(
    base_ocr_confidence: float,
    validations: Dict[str, Tuple[bool, float, str]],
    gemini_confidence: Optional[float] = None
) -> float:
    """
    Compute overall confidence score
    
    Args:
        base_ocr_confidence: OCR average confidence (0-1)
        validations: Dict of field validations
        gemini_confidence: Gemini's reported confidence (if available)
    
    Returns:
        Final confidence score (0-1)
    """
    # Start with OCR confidence
    confidence = base_ocr_confidence * 0.4  # OCR contributes 40%
    
    # Add validation adjustments
    for field, (is_valid, adjustment, reason) in validations.items():
        confidence += adjustment
    
    # Factor in Gemini confidence if available
    if gemini_confidence is not None:
        confidence += gemini_confidence * 0.2  # Gemini contributes 20%
    
    # Ensure bounds
    confidence = max(0.0, min(1.0, confidence))
    
    return confidence

def validate_and_score(
    extracted_data: Dict,
    candidates: Dict,
    ocr_confidence: float
) -> Tuple[Dict, float, str, Optional[str]]:
    """
    Validate extracted data and compute confidence
    
    Returns:
        (validated_data, confidence, status, needs_review_reason)
        status: "PASS" | "NEEDS_REVIEW" | "FAIL"
    """
    validations = {}
    
    # Validate each field
    validations["amount"] = validate_amount(
        extracted_data.get("amount"),
        candidates.get("amounts", [])
    )
    
    validations["date"] = validate_date(
        extracted_data.get("date"),
        candidates.get("dates", [])
    )
    
    validations["currency"] = validate_currency(
        extracted_data.get("currency"),
        extracted_data.get("language", "unknown")
    )
    
    validations["merchant"] = validate_merchant(
        extracted_data.get("merchant")
    )
    
    validations["category"] = validate_category(
        extracted_data.get("category")
    )
    
    # Compute confidence
    gemini_confidence = extracted_data.get("confidence")
    final_confidence = compute_confidence(
        ocr_confidence,
        validations,
        gemini_confidence
    )
    
    # Determine status
    status = "PASS"
    needs_review_reason = None
    
    # Check for critical failures
    if not validations["amount"][0]:
        status = "FAIL"
        needs_review_reason = validations["amount"][2]
    elif extracted_data.get("amount") is None:
        status = "NEEDS_REVIEW"
        needs_review_reason = "amount_not_extracted"
    elif final_confidence < 0.70:
        status = "NEEDS_REVIEW"
        needs_review_reason = f"low_confidence:{final_confidence:.2f}"
    
    # Apply defaults for missing non-critical fields
    validated_data = extracted_data.copy()
    
    if validated_data.get("currency") is None:
        if validated_data.get("language") in ["arabic", "both"]:
            validated_data["currency"] = "AED"
        else:
            validated_data["currency"] = None
    
    if validated_data.get("category") is None:
        validated_data["category"] = "Other"
    
    if validated_data.get("date") is None:
        validated_data["date"] = datetime.now().strftime('%Y-%m-%d')
    
    # Add validation details
    validated_data["validation_details"] = {
        field: {"valid": v[0], "reason": v[2]}
        for field, v in validations.items()
    }
    
    return validated_data, final_confidence, status, needs_review_reason
