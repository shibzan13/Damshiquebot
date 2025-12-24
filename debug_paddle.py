try:
    from paddleocr import PaddleOCR
    import inspect
    print("PaddleOCR constructor signature:")
    print(inspect.signature(PaddleOCR.__init__))
except Exception as e:
    print(f"Error: {e}")
