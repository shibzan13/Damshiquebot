
import sys
import json
import traceback

try:
    from paddleocr import PaddleOCR
except ImportError:
    print(json.dumps({"error": "PaddleOCR not installed", "details": "Run pip install paddlepaddle paddleocr"}))
    sys.exit(1)

def extract_text_paddle(image_path):
    try:
        # Initialize PaddleOCR (english, use_angle_cls=True)
        ocr = PaddleOCR(use_angle_cls=True, lang='en')
        
        result = ocr.ocr(image_path, cls=True)
        
        lines = []
        if result and result[0]:
            for line in result[0]:
                text = line[1][0]
                lines.append(text)
        
        full_text = "\n".join(lines)
        return {"text": full_text, "lines": lines}

    except Exception as e:
        return {"error": str(e), "traceback": traceback.format_exc()}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing image path arguments"}))
        sys.exit(1)
        
    image_path = sys.argv[1]
    data = extract_text_paddle(image_path)
    print(json.dumps(data))
