import asyncio
import sys
import os

# Add root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from tools.document_tools.ocr_tools import ocr_paddle, preprocess_image

async def test_ocr():
    img_path = "uploads/1766152854094009.jpg"
    if not os.path.exists(img_path):
        print(f"Skipping, {img_path} not found.")
        return
        
    print("Testing OCR Tool...")
    proc = preprocess_image(img_path)
    res = ocr_paddle(proc)
    
    print(f"OCR Result: {res['raw_text'][:100]}...")
    print(f"Confidence: {res['ocr_confidence']:.2f}")
    
    if res['ocr_confidence'] > 0:
        print("✅ SUCCESS: OCR tool functional.")
    else:
        print("❌ FAILURE: OCR returned no results.")

if __name__ == "__main__":
    asyncio.run(test_ocr())
