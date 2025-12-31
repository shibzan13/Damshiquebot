import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class ValidationEngine:
    """
    Finance Validation Engine.
    Judges the correctness and compliance of extracted invoice data.
    """

    @staticmethod
    def validate_invoice(invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        flags = []
        is_valid = True
        
        # 1. Mandatory Fields
        if not invoice_data.get("vendor_name") or invoice_data["vendor_name"] == "Unknown":
            flags.append({"code": "MISSING_VENDOR", "severity": "error", "message": "Vendor name is missing."})
            is_valid = False
            
        if not invoice_data.get("invoice_date"):
            flags.append({"code": "MISSING_DATE", "severity": "error", "message": "Invoice date is missing."})
            is_valid = False

        # 2. Mathematical Consistency (Total vs Line Items)
        total_amount = float(invoice_data.get("total_amount") or 0)
        items_total = sum(float(item.get("line_total") or 0) for item in invoice_data.get("line_items", []))
        
        if items_total > 0 and abs(total_amount - items_total) > 0.05:
            flags.append({
                "code": "TOTAL_MISMATCH", 
                "severity": "warning", 
                "message": f"Summary total ({total_amount}) does not match line items total ({items_total})."
            })

        # 3. Tax / VAT Validation (UAE Focus)
        tax_amount = float(invoice_data.get("tax_amount") or 0)
        subtotal = float(invoice_data.get("subtotal") or 0)
        
        # Standard UAE VAT is 5%
        expected_vat = round(subtotal * 0.05, 2)
        if subtotal > 0 and tax_amount > 0 and abs(tax_amount - expected_vat) > 0.10:
             flags.append({
                "code": "VAT_CALC_INCORRECT", 
                "severity": "warning", 
                "message": f"VAT amount ({tax_amount}) deviates from standard UAE 5% ({expected_vat})."
            })

        # 4. Currency Validation
        valid_currencies = ['AED', 'USD', 'EUR', 'GBP', 'SAR']
        if invoice_data.get("currency") not in valid_currencies:
            flags.append({
                "code": "UNUSUAL_CURRENCY", 
                "severity": "warning", 
                "message": f"Currency {invoice_data.get('currency')} is not in the standard list."
            })

        # 5. Fraud/Anomaly Patterns (Simple checks)
        # Check for weekend spending (Anomalies)
        if invoice_data.get("invoice_date"):
            try:
                from datetime import datetime
                dt = datetime.strptime(invoice_data["invoice_date"], "%Y-%m-%d")
                if dt.weekday() in [5, 6]: # Sat, Sun (UAE weekend is Sat-Sun or Fri-Sat depending on old/new)
                    flags.append({
                        "code": "WEEKEND_SPENDING", 
                        "severity": "info", 
                        "message": "Expense occurred on a weekend."
                    })
            except:
                pass

        return {
            "is_valid": is_valid,
            "compliance_flags": flags,
            "score": 1.0 - (len([f for f in flags if f['severity'] == 'error']) * 0.5)
        }
