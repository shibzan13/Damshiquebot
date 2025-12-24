"""
Production-grade expense extraction pipeline
PaddleOCR + Gemini with deterministic fallback
"""

from .receipt_pipeline import extract_expense

__all__ = ['extract_expense']
