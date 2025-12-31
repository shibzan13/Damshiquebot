import os
import logging
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.0-flash"

async def generate_chat_response(user_message, history=None):
    """
    Generates a conversational response using Gemini.
    """
    if not GEMINI_API_KEY:
        return "I'm here to help track your expenses! (AI not configured)"

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        system_instructions = """You are a helpful, friendly, and professional AI Expense Assistant named 'ExpenseBot'.
        Your goal is to help users track their expenses via WhatsApp.
        
        Capabilities:
        - You can extract data from receipts (images/PDFs) sent to you.
        - You can list recent expenses or show totals when asked.
        - You can export data to Excel.
        - You can clear data.
        
        Personality:
        - Be concise and direct (WhatsApp style).
        - Use emojis to make the conversation friendly.
        - If the user sends a greeting, welcome them and explain what you can do.
        - If the user asks something out of scope, politely redirect them to expense tracking.
        
        Current context: The user has sent a text message.
        """
        
        prompt = f"User says: {user_message}"
        
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instructions,
                temperature=0.7,
                max_output_tokens=200
            )
        )
        
        return response.text.strip()
        
    except Exception as e:
        logger.error(f"Chat generation failed: {e}")
        return "I received your message! Send me a receipt photo to track an expense, or ask me to 'List expenses' or 'Show totals'."
