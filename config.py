import os
from dotenv import load_dotenv

load_dotenv()

# 🤖 Google Gemini AI Configuration (PRIMARY AI ENGINE)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# WhatsApp Cloud API Configuration
WA_TOKEN = os.getenv("WA_TOKEN")
WA_PHONE_ID = os.getenv("WA_PHONE_ID")
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "your_verify_token")

# App Configuration
PORT = int(os.getenv("PORT", 3000))

# Validation
if not GEMINI_API_KEY:
    print("❌ WARNING: GEMINI_API_KEY is not set!")
    print("   The bot will not work without Gemini API key.")
    print("   Get your key from: https://makersuite.google.com/app/apikey")
else:
    print(f"✅ AI Engine: Google Gemini")

if not WA_TOKEN or not WA_PHONE_ID:
    print("⚠️ WARNING: WhatsApp credentials not configured")
    print("   Set WA_TOKEN and WA_PHONE_ID in .env file")
