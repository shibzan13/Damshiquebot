import re
from datetime import datetime

TEMPLATES = [
    {
        "name": "Carrefour UAE",
        "keywords": ["carrefour", "majid al futtaim"],
        "patterns": {
            "merchant": re.compile(r"carrefour", re.IGNORECASE),
            "total": re.compile(r"(?:total|grand total|amount due|dhs|aed)\s*[:]*\s*(\d+[.,]\d{2})", re.IGNORECASE),
            "date": re.compile(r"\b(\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})\b|\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b")
        }
    },
    {
        "name": "Lulu Hypermarket",
        "keywords": ["lulu", "emke group"],
        "patterns": {
            "merchant": re.compile(r"lulu\s*(?:hypermarket|express|supermarket)", re.IGNORECASE),
            "total": re.compile(r"(?:total|net payable|aed)\s*[:]*\s*(\d+[.,]\d{2})", re.IGNORECASE),
            "date": re.compile(r"\b(\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})\b|\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b")
        }
    },
    {
        "name": "Generic Receipt",
        "keywords": ["total", "tax", "invoice"],
        "patterns": {
            "merchant": re.compile(r"^([A-Z0-9\s&]{3,30})", re.MULTILINE),
            "total": re.compile(r"(?:total|amount|sum|payable|balance|net)\s*(?:aed|dhs|usd|\$|gbp|eur)?\s*[:]*\s*(\d+[.,]\d{2})", re.IGNORECASE),
            "date": re.compile(r"\b(\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})\b|\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b")
        }
    }
]

GLOBAL_PATTERNS = {
    "amount": [
        re.compile(r"(?:total|grand total|total amount|amount due|net payable|payable amount|paid|sum|total dhs|total aed)\s*(?:aed|dhs|usd|\$)?\s*[:]*\s*(\d+[.,]\d{2})", re.IGNORECASE),
        re.compile(r"(?:aed|dhs|usd|\$)\s*[:]*\s*(\d+[.,]\d{2})", re.IGNORECASE),
        re.compile(r"(\d+[.,]\d{2})\s*(?:total|paid|aed|dhs)", re.IGNORECASE)
    ],
    "date": [
        re.compile(r"\b(\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})\b"),
        re.compile(r"\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b")
    ],
    "merchant": [
        re.compile(r"^([A-Z0-9\s&.]{3,40})", re.MULTILINE),
        re.compile(r"merchant[:\s]+([A-Z0-9\s&.]+)", re.IGNORECASE),
        re.compile(r"store[:\s]+([A-Z0-9\s&.]+)", re.IGNORECASE)
    ]
}

def format_extracted_date(date_str):
    try:
        parts = re.split(r"[\/\-. ]", date_str)
        if len(parts) != 3:
            return date_str

        day, month, year = None, None, None
        if len(parts[0]) == 4:
            year, month, day = parts
        elif len(parts[2]) in [2, 4]:
            day, month, year = parts
            if len(year) == 2:
                cur_year_short = datetime.now().year % 100
                year = ("19" if int(year) > cur_year_short + 5 else "20") + year
        else:
            return date_str

        if int(month) > 12 and int(day) <= 12:
            day, month = month, day

        return f"{year}-{int(month):02d}-{int(day):02d}"
    except:
        return datetime.now().strftime("%Y-%m-%d")

def extract_with_templates(text):
    if not text:
        return None

    clean_text = " ".join(text.split())
    lower_text = clean_text.lower()

    result = {
        "merchant": "Unknown Merchant",
        "amount": None,
        "currency": "AED",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "category": "Other",
        "confidence": 0.1,
        "method": "template"
    }

    best_template = None
    for template in TEMPLATES:
        if any(k in lower_text for k in template["keywords"]):
            best_template = template
            break

    if best_template:
        print(f"📋 Matching against template: {best_template['name']}")
        
        amt_match = best_template["patterns"]["total"].search(clean_text)
        if amt_match:
            result["amount"] = float(amt_match.group(1).replace(",", ""))
            result["confidence"] += 0.4

        date_match = best_template["patterns"]["date"].search(clean_text)
        if date_match:
            actual_date = next((group for group in date_match.groups() if group is not None), None)
            if actual_date:
                result["date"] = format_extracted_date(actual_date)
                result["confidence"] += 0.2

        merch_match = best_template["patterns"]["merchant"].search(clean_text)
        if merch_match:
            result["merchant"] = merch_match.group(0).strip()
            result["confidence"] += 0.2
        elif best_template["name"] != "Generic Receipt":
            result["merchant"] = best_template["name"]
            result["confidence"] += 0.2

    if not result["amount"]:
        for pattern in GLOBAL_PATTERNS["amount"]:
            match = pattern.search(clean_text)
            if match:
                result["amount"] = float(match.group(1).replace(",", ""))
                result["confidence"] += 0.2
                break

    if result["merchant"] == "Unknown Merchant":
        for pattern in GLOBAL_PATTERNS["merchant"]:
            match = pattern.search(clean_text)
            if match and match.group(1):
                result["merchant"] = match.group(1).strip()
                break

    if result["date"] == datetime.now().strftime("%Y-%m-%d"):
        for pattern in GLOBAL_PATTERNS["date"]:
            match = pattern.search(clean_text)
            if match:
                actual_date = next((group for group in match.groups() if group is not None), None)
                if actual_date:
                    result["date"] = format_extracted_date(actual_date)
                    result["confidence"] += 0.1
                    break

    for cur, codes in {"SAR": ["sar", "riyal"], "USD": ["usd", "$"], "EUR": ["eur", "€"], "GBP": ["gbp", "£"]}.items():
        if any(code in lower_text for code in codes):
            result["currency"] = cur
            break

    if result["amount"]:
        result["confidence"] = min(result["confidence"], 1.0)
        return result

    return None
