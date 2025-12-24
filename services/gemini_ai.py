"""
Gemini-Only AI Service with Agentic Capabilities
Replaces OpenRouter completely - uses only Google Gemini
"""

import google.generativeai as genai
import os
import json
import re
from typing import Optional, Dict, Any, List
from datetime import datetime

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.0-flash"  # Updated to available model

# Initialize Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print(f"✅ Gemini AI initialized with model: {GEMINI_MODEL}")
else:
    print("❌ GEMINI_API_KEY not set!")

def is_available():
    """Check if Gemini is configured"""
    return GEMINI_API_KEY is not None

async def call_gemini(prompt: str, temperature: float = 0.7, json_mode: bool = False) -> Optional[str]:
    """
    Call Gemini API with text prompt
    """
    if not GEMINI_API_KEY:
        print("❌ Gemini not configured")
        return None
    
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        if json_mode:
            prompt = f"{prompt}\n\nIMPORTANT: Respond ONLY with valid JSON, no markdown, no explanation."
        
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=temperature,
            )
        )
        
        return response.text
    except Exception as e:
        print(f"❌ Gemini API error: {e}")
        return None

async def call_gemini_vision(prompt: str, image_data: bytes, mime_type: str = "image/jpeg") -> Optional[str]:
    """
    Call Gemini Vision API with image
    """
    if not GEMINI_API_KEY:
        print("❌ Gemini not configured")
        return None
    
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        import base64
        image_part = {
            "mime_type": mime_type,
            "data": base64.b64encode(image_data).decode()
        }
        
        response = await model.generate_content_async([prompt, image_part])
        return response.text
    except Exception as e:
        print(f"❌ Gemini Vision error: {e}")
        return None

async def extract_expense_from_text(text: str) -> Optional[Dict[str, Any]]:
    """
    Extract expense data from text using Gemini
    """
    prompt = f"""Extract expense information from this text and return ONLY a JSON object.

Text: {text}

Return this exact JSON structure:
{{
  "merchant": "business name",
  "amount": 123.45,
  "currency": "AED",
  "date": "YYYY-MM-DD",
  "category": "Groceries|Food & Dining|Transport|Utilities|Shopping|Entertainment|Health|Services|Travel|Other"
}}

Rules:
- Use today's date if not specified: {datetime.now().strftime('%Y-%m-%d')}
- Default currency to AED if not specified
- Choose the most appropriate category
- Return ONLY the JSON, nothing else"""

    response = await call_gemini(prompt, temperature=0.1, json_mode=True)
    
    if not response:
        return None
    
    try:
        # Extract JSON from response
        text = response.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            json_str = text[start:end]
            result = json.loads(json_str)
            
            if result.get("amount"):
                print(f"✅ Gemini extracted: {result.get('merchant')} - {result.get('amount')} {result.get('currency')}")
                return result
    except Exception as e:
        print(f"⚠️ Failed to parse Gemini response: {e}")
    
    return None

async def extract_expense_from_image(file_path: str) -> Optional[Dict[str, Any]]:
    """
    Extract expense data from image using Gemini Vision
    """
    try:
        with open(file_path, 'rb') as f:
            image_data = f.read()
        
        prompt = """Analyze this receipt/invoice image and extract expense information.

Return ONLY a JSON object with this structure:
{
  "merchant": "business name",
  "amount": 123.45,
  "currency": "AED",
  "date": "YYYY-MM-DD",
  "category": "Groceries|Food & Dining|Transport|Utilities|Shopping|Entertainment|Health|Services|Travel|Other"
}

Rules:
- Find the TOTAL/GRAND TOTAL amount (not subtotals)
- Convert dates to YYYY-MM-DD format
- Default currency to AED if not specified
- Choose the most appropriate category
- Return ONLY the JSON, nothing else"""

        response = await call_gemini_vision(prompt, image_data)
        
        if not response:
            return None
        
        # Extract JSON from response
        text = response.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            json_str = text[start:end]
            result = json.loads(json_str)
            
            if result.get("amount"):
                print(f"✅ Gemini Vision extracted: {result.get('merchant')} - {result.get('amount')} {result.get('currency')}")
                return result
    except Exception as e:
        print(f"❌ Gemini Vision extraction failed: {e}")
    
    return None

async def chat_with_context(user_message: str, chat_history: List[Dict], expense_context: str) -> str:
    """
    Agentic chat with expense context
    """
    # Build conversation context
    context = f"""You are an AI Expense Assistant. Help the user manage their expenses.

EXPENSE CONTEXT:
{expense_context}

CAPABILITIES:
- Answer questions about expenses
- Provide spending insights
- Help categorize expenses
- Give financial advice

Be helpful, concise, and friendly."""

    # Build messages
    conversation = f"{context}\n\n"
    
    # Add chat history (last 5 messages)
    for msg in chat_history[-5:]:
        role = "User" if msg["role"] == "user" else "Assistant"
        conversation += f"{role}: {msg['content']}\n"
    
    conversation += f"User: {user_message}\nAssistant:"
    
    response = await call_gemini(conversation, temperature=0.7)
    
    if response:
        return response.strip()
    else:
        return "Sorry, I'm having trouble processing your request right now. Please try again."

async def analyze_spending_pattern(expenses: List[Dict]) -> str:
    """
    Analyze spending patterns using Gemini
    """
    if not expenses:
        return "No expenses to analyze yet."
    
    # Prepare expense summary
    summary = {
        "total_expenses": len(expenses),
        "categories": {},
        "currencies": {},
        "recent": []
    }
    
    for exp in expenses[:10]:
        cat = exp.get("category", "Other")
        cur = exp.get("currency", "AED")
        amt = float(exp.get("amount", 0))
        
        summary["categories"][cat] = summary["categories"].get(cat, 0) + amt
        summary["currencies"][cur] = summary["currencies"].get(cur, 0) + amt
        summary["recent"].append(f"{exp.get('merchant')}: {amt} {cur}")
    
    prompt = f"""Analyze this spending data and provide insights:

{json.dumps(summary, indent=2)}

Provide:
1. Top spending categories
2. Spending trends
3. Recommendations to save money

Keep it concise and actionable (max 200 words)."""

    response = await call_gemini(prompt, temperature=0.3)
    
    if response:
        return response.strip()
    else:
        return "Unable to analyze spending patterns at the moment."
