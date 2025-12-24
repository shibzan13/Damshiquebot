"""
Candidate Extraction - Deterministic field extraction from OCR text
Extracts amounts, dates, merchants, currency with confidence scoring
"""

import re
from typing import List, Dict, Tuple
from datetime import datetime

# Keywords for amount detection (English + Arabic)
TOTAL_KEYWORDS_EN = [
    "total", "grand total", "amount due", "balance due", "payable",
    "net payable", "amount payable", "total amount", "final amount"
]

TOTAL_KEYWORDS_AR = [
    "الإجمالي", "المجموع", "المبلغ الإجمالي", "المبلغ المستحق",
    "الصافي", "المبلغ الكلي", "الإجمالي الكلي"
]

# Negative keywords (penalize these)
NEGATIVE_KEYWORDS = [
    "subtotal", "sub total", "sub-total", "vat", "tax", "discount",
    "change", "cash", "card", "المجموع الفرعي", "ضريبة", "خصم"
]

# Currency patterns
CURRENCY_PATTERNS = {
    "AED": [r"aed", r"د\.إ", r"dhs", r"dirham"],
    "SAR": [r"sar", r"ر\.س", r"riyal", r"ريال"],
    "GBP": [r"gbp", r"£", r"pound"],
    "USD": [r"usd", r"\$", r"dollar"],
    "QAR": [r"qar", r"ر\.ق", r"qatari"],
    "EUR": [r"eur", r"€", r"euro"]
}

def extract_amount_candidates(text: str) -> List[Dict]:
    """
    Extract amount candidates with scoring
    Returns: [{value, currency, score, evidence}]
    """
    candidates = []
    lines = text.split('\n')
    
    # Regex for amounts: matches 123.45, 1,234.56, etc.
    amount_pattern = re.compile(r'(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?|\d+\.\d{2})')
    
    for line_idx, line in enumerate(lines):
        line_lower = line.lower()
        
        # Find all amounts in this line
        for match in amount_pattern.finditer(line):
            amount_str = match.group(1).replace(',', '').replace(' ', '')
            try:
                amount_value = float(amount_str)
                
                # Skip unrealistic amounts
                if amount_value < 0.01 or amount_value > 1000000:
                    continue
                
                # Calculate score
                score = 0.5  # Base score
                evidence = []
                
                # Check for positive keywords
                for keyword in TOTAL_KEYWORDS_EN + TOTAL_KEYWORDS_AR:
                    if keyword in line_lower:
                        score += 0.3
                        evidence.append(f"keyword:{keyword}")
                        break
                
                # Check for negative keywords (penalize)
                for keyword in NEGATIVE_KEYWORDS:
                    if keyword in line_lower:
                        score -= 0.4
                        evidence.append(f"negative:{keyword}")
                        break
                
                # Detect currency in same line
                detected_currency = None
                for currency, patterns in CURRENCY_PATTERNS.items():
                    for pattern in patterns:
                        if re.search(pattern, line_lower):
                            detected_currency = currency
                            score += 0.1
                            evidence.append(f"currency:{currency}")
                            break
                    if detected_currency:
                        break
                
                # Context bonus: if near end of document
                if line_idx > len(lines) * 0.6:
                    score += 0.1
                    evidence.append("position:bottom")
                
                # Larger amounts more likely to be totals
                if amount_value > 50:
                    score += 0.05
                
                candidates.append({
                    "value": amount_value,
                    "currency": detected_currency,
                    "score": min(score, 1.0),
                    "evidence": " | ".join(evidence) if evidence else "raw_amount",
                    "line": line.strip()
                })
                
            except ValueError:
                continue
    
    # Sort by score descending
    candidates.sort(key=lambda x: x["score"], reverse=True)
    
    # Deduplicate similar amounts
    unique_candidates = []
    seen_values = set()
    for c in candidates:
        if c["value"] not in seen_values:
            unique_candidates.append(c)
            seen_values.add(c["value"])
    
    return unique_candidates[:10]  # Top 10

def extract_date_candidates(text: str) -> List[Dict]:
    """
    Extract date candidates with scoring
    Returns: [{value, score, evidence}]
    """
    candidates = []
    lines = text.split('\n')
    
    # Date patterns
    date_patterns = [
        (r'\b(\d{4}[-/\.]\d{1,2}[-/\.]\d{1,2})\b', 'YYYY-MM-DD'),
        (r'\b(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{4})\b', 'DD-MM-YYYY'),
        (r'\b(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2})\b', 'DD-MM-YY'),
    ]
    
    date_keywords = ["date", "invoice date", "bill date", "تاريخ", "التاريخ"]
    
    for line in lines:
        line_lower = line.lower()
        
        for pattern, format_name in date_patterns:
            for match in re.finditer(pattern, line):
                date_str = match.group(1)
                
                # Try to parse date
                parsed_date = parse_date(date_str)
                if not parsed_date:
                    continue
                
                # Calculate score
                score = 0.5
                evidence = []
                
                # Check for date keywords
                for keyword in date_keywords:
                    if keyword in line_lower:
                        score += 0.3
                        evidence.append(f"keyword:{keyword}")
                        break
                
                # Prefer dates near top of document
                if lines.index(line) < len(lines) * 0.3:
                    score += 0.1
                    evidence.append("position:top")
                
                # Validate date is reasonable (not far future/past)
                today = datetime.now()
                date_obj = datetime.strptime(parsed_date, '%Y-%m-%d')
                days_diff = abs((today - date_obj).days)
                
                if days_diff > 365 * 5:  # More than 5 years
                    score -= 0.3
                    evidence.append("warning:old_date")
                elif days_diff < 365:  # Within last year
                    score += 0.1
                    evidence.append("recent")
                
                candidates.append({
                    "value": parsed_date,
                    "score": min(score, 1.0),
                    "evidence": " | ".join(evidence) if evidence else format_name,
                    "line": line.strip()
                })
    
    # Sort by score
    candidates.sort(key=lambda x: x["score"], reverse=True)
    
    # Deduplicate
    unique_candidates = []
    seen_values = set()
    for c in candidates:
        if c["value"] not in seen_values:
            unique_candidates.append(c)
            seen_values.add(c["value"])
    
    return unique_candidates[:5]

def parse_date(date_str: str) -> str:
    """
    Parse various date formats to YYYY-MM-DD
    Returns None if parsing fails
    """
    # Clean up separators
    date_str = date_str.replace('/', '-').replace('.', '-')
    
    formats = [
        '%Y-%m-%d',
        '%d-%m-%Y',
        '%d-%m-%y',
        '%m-%d-%Y',
        '%m-%d-%y'
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            
            # Handle 2-digit years
            if dt.year < 100:
                current_year = datetime.now().year
                century = (current_year // 100) * 100
                dt = dt.replace(year=century + dt.year)
            
            return dt.strftime('%Y-%m-%d')
        except ValueError:
            continue
    
    return None

def extract_merchant_candidates(text: str) -> List[Dict]:
    """
    Extract merchant name candidates
    Returns: [{value, score, evidence}]
    """
    candidates = []
    lines = text.split('\n')
    
    merchant_keywords = [
        "merchant", "store", "shop", "company", "vat trn", "tax id",
        "vat no", "cr no", "اسم", "المحل", "الشركة"
    ]
    
    # Top lines are usually merchant names
    for idx, line in enumerate(lines[:15]):  # Check first 15 lines
        line_clean = line.strip()
        
        if not line_clean or len(line_clean) < 3:
            continue
        
        # Skip lines that are just numbers or dates
        if re.match(r'^[\d\s\-/:.]+$', line_clean):
            continue
        
        # Skip common non-merchant lines
        skip_words = ["invoice", "receipt", "bill", "tax", "vat", "total", "date"]
        if any(word in line_clean.lower() for word in skip_words):
            continue
        
        score = 0.5
        evidence = []
        
        # Higher score for top lines
        if idx < 5:
            score += 0.3
            evidence.append(f"position:top_{idx+1}")
        
        # Check for merchant keywords nearby
        line_lower = line.lower()
        for keyword in merchant_keywords:
            if keyword in line_lower:
                score += 0.2
                evidence.append(f"keyword:{keyword}")
                break
        
        # Prefer lines with mixed case (proper names)
        if line_clean != line_clean.upper() and line_clean != line_clean.lower():
            score += 0.1
            evidence.append("mixed_case")
        
        # Prefer longer names (but not too long)
        if 5 <= len(line_clean) <= 40:
            score += 0.1
        
        candidates.append({
            "value": line_clean,
            "score": min(score, 1.0),
            "evidence": " | ".join(evidence) if evidence else "top_line",
            "line": line_clean
        })
    
    # Sort by score
    candidates.sort(key=lambda x: x["score"], reverse=True)
    
    return candidates[:5]

def detect_language(text: str) -> str:
    """
    Detect if text contains Arabic, English, or both
    """
    has_arabic = bool(re.search(r'[\u0600-\u06FF]', text))
    has_english = bool(re.search(r'[a-zA-Z]', text))
    
    if has_arabic and has_english:
        return "both"
    elif has_arabic:
        return "arabic"
    elif has_english:
        return "english"
    else:
        return "unknown"

def extract_all_candidates(raw_text: str) -> Dict:
    """
    Extract all candidates from OCR text
    Returns dict with amounts, dates, merchants, language
    """
    return {
        "amounts": extract_amount_candidates(raw_text),
        "dates": extract_date_candidates(raw_text),
        "merchants": extract_merchant_candidates(raw_text),
        "language": detect_language(raw_text)
    }
