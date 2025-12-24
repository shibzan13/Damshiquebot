"""
Receipt Extraction Pipeline - Main Entry Point
Production-grade extraction: PaddleOCR + Gemini with deterministic fallback
"""

import os
import json
import uuid
from typing import Dict
from datetime import datetime

from .ocr import run_paddleocr, extract_text_from_pdf
from .candidates import extract_all_candidates
from .gemini_client import call_gemini_for_structuring
from .validate import validate_and_score

async def extract_expense(document_path: str, mime_type: str, user_phone: str) -> Dict:
    """
    Main extraction pipeline (Async)
    """
    
    # Generate document ID
    document_id = str(uuid.uuid4())
    
    # Initialize result structure
    result = {
        "document_id": document_id,
        "user_phone": user_phone,
        "document_type": "other",
        "merchant": None,
        "amount": None,
        "currency": None,
        "date": None,
        "category": None,
        "items": [],
        "language": "unknown",
        "raw_text": "",
        "candidates": {
            "amounts": [],
            "dates": [],
            "merchants": []
        },
        "confidence": 0.0,
        "status": "FAIL",
        "needs_review_reason": None,
        "notes": None,
        "engine": "paddleocr_only"
    }
    
    try:
        # ===== STEP A: Ingestion =====
        print(f"\n{'='*60}")
        print(f"🔍 Processing: {os.path.basename(document_path)}")
        print(f"{'='*60}")
        
        if not os.path.exists(document_path):
            result["status"] = "FAIL"
            result["needs_review_reason"] = "file_not_found"
            result["notes"] = f"File not found: {document_path}"
            return result
        
        # ===== STEP B: OCR (PaddleOCR) =====
        print("\n📝 Step 1: Running PaddleOCR...")
        
        if mime_type == "application/pdf" or document_path.lower().endswith('.pdf'):
            ocr_result = extract_text_from_pdf(document_path)
        else:
            ocr_result = run_paddleocr(document_path)
        
        if not ocr_result["success"]:
            result["status"] = "FAIL"
            result["needs_review_reason"] = "ocr_failed"
            result["notes"] = ocr_result.get("error", "OCR failed")
            return result
        
        raw_text = ocr_result["raw_text"]
        ocr_confidence = ocr_result["avg_confidence"]
        
        result["raw_text"] = raw_text
        
        print(f"   ✅ OCR complete: {len(raw_text)} chars, confidence: {ocr_confidence:.2f}")
        
        if len(raw_text) < 10:
            result["status"] = "FAIL"
            result["needs_review_reason"] = "insufficient_text"
            result["notes"] = "OCR extracted too little text"
            return result
        
        # ===== STEP C: Candidate Extraction (Deterministic) =====
        print("\n🔎 Step 2: Extracting candidates...")
        
        candidates = extract_all_candidates(raw_text)
        
        result["candidates"] = candidates
        result["language"] = candidates["language"]
        
        print(f"   ✅ Found {len(candidates['amounts'])} amount candidates")
        print(f"   ✅ Found {len(candidates['dates'])} date candidates")
        print(f"   ✅ Found {len(candidates['merchants'])} merchant candidates")
        print(f"   ✅ Language: {candidates['language']}")
        
        # ===== STEP D: Gemini Structuring (Optional) =====
        print("\n🤖 Step 3: Gemini structuring...")
        
        # We pass the document path for Vision/PDF context
        doc_path = document_path if (mime_type.startswith("image/") or mime_type == "application/pdf") else None
        
        gemini_result = await call_gemini_for_structuring(
            raw_text,
            candidates["amounts"],
            candidates["dates"],
            candidates["merchants"],
            doc_path=doc_path
        )
        
        if gemini_result:
            # Use Gemini's structured output
            result["merchant"] = gemini_result.get("merchant")
            result["amount"] = gemini_result.get("amount")
            result["currency"] = gemini_result.get("currency")
            result["date"] = gemini_result.get("date")
            result["category"] = gemini_result.get("category")
            result["items"] = gemini_result.get("items", [])
            result["language"] = gemini_result.get("language", candidates["language"])
            result["notes"] = gemini_result.get("notes")
            result["engine"] = "paddleocr+gemini"
            
            print(f"   ✅ Gemini extracted: {result['merchant']} - {result['amount']} {result['currency']}")
        else:
            # Fallback to deterministic selection from candidates
            print("   ⚠️ Gemini failed, using deterministic fallback")
            
            # Select best candidates
            if candidates["amounts"]:
                best_amount = candidates["amounts"][0]
                result["amount"] = best_amount["value"]
                result["currency"] = best_amount.get("currency")
            
            if candidates["dates"]:
                result["date"] = candidates["dates"][0]["value"]
            
            if candidates["merchants"]:
                result["merchant"] = candidates["merchants"][0]["value"]
            
            # Default category
            result["category"] = "Other"
            result["notes"] = "Deterministic extraction (Gemini unavailable)"
            result["engine"] = "paddleocr_only"
        
        # Infer document type
        if result["amount"] is not None:
            result["document_type"] = "receipt" if "receipt" in raw_text.lower() else "invoice"
        
        # ===== STEP E: Validation + Finalization =====
        print("\n✅ Step 4: Validation and confidence scoring...")
        
        validated_data, final_confidence, status, needs_review_reason = validate_and_score(
            result,
            candidates,
            ocr_confidence
        )
        
        # Update result with validated data
        result.update(validated_data)
        result["confidence"] = final_confidence
        result["status"] = status
        result["needs_review_reason"] = needs_review_reason
        
        print(f"   ✅ Final confidence: {final_confidence:.2f}")
        print(f"   ✅ Status: {status}")
        
        if needs_review_reason:
            print(f"   ⚠️ Needs review: {needs_review_reason}")
        
        # ===== STEP F: Output =====
        print(f"\n{'='*60}")
        print(f"✅ Extraction complete!")
        print(f"{'='*60}")
        print(f"Merchant: {result['merchant']}")
        print(f"Amount: {result['amount']} {result['currency']}")
        print(f"Date: {result['date']}")
        print(f"Category: {result['category']}")
        print(f"Confidence: {result['confidence']:.2f}")
        print(f"Status: {result['status']}")
        print(f"{'='*60}\n")
        
        return result
        
    except Exception as e:
        # Catch-all error handler
        print(f"\n❌ Pipeline error: {e}")
        import traceback
        traceback.print_exc()
        
        result["status"] = "FAIL"
        result["needs_review_reason"] = "pipeline_error"
        result["notes"] = str(e)
        
        return result

async def async_main():
    """Async CLI entry point for testing"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python -m extractor.receipt_pipeline <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    # Detect mime type
    if file_path.lower().endswith('.pdf'):
        mime_type = "application/pdf"
    elif file_path.lower().endswith(('.jpg', '.jpeg')):
        mime_type = "image/jpeg"
    elif file_path.lower().endswith('.png'):
        mime_type = "image/png"
    else:
        mime_type = "application/octet-stream"
    
    # Run async extraction
    result = await extract_expense(file_path, mime_type, "test_user")
    
    # Print JSON output
    print("\n" + "="*60)
    print("FINAL JSON OUTPUT:")
    print("="*60)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    sys.exit(0 if result["status"] == "PASS" else 1)

if __name__ == "__main__":
    import asyncio
    asyncio.run(async_main())
