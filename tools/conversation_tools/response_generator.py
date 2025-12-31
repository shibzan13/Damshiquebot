import json
import logging
from typing import Dict, Any, Optional
from tools.document_tools.extraction_tools import get_gemini_client
from google.genai import types
from datetime import datetime

logger = logging.getLogger(__name__)

async def generate_bot_response(user_query: str, query_results: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> str:
    """
    Step 5: Response Generation (LLM – Summarization Only)
    Converts structured query results into natural language.
    Does not invent data or perform calculations beyond provided data.
    """
    client = get_gemini_client()
    if not client:
        return "System error: Cannot generate response."

    system_prompt = """You are Damshique AI, a sophisticated Finance Intelligence Assistant.
    
    Personality:
    - You are helpful, professional, and friendly.
    - If the user greets you or wants to chat (e.g., "How are you?", "Who are you?"), respond warmly and naturally like a high-end personal assistant. You can discuss general topics!
    - For general questions not related to finance, use your own broad knowledge to answer helpfully. Don't be robotic.

    Data & Facts:
    - If 'Query Results' contains specific database data (invoices, spend, users), prioritize summarizing that data with 100% accuracy.
    - Do NOT invent financial facts or numbers.
    - If a user asks a specific financial question (e.g., "What's my balance?") and 'Query Results' is empty, explain that you couldn't find that specific data in the records.
    - Use bullet points for lists and keep summaries concise.
    
    Current System Time: {current_time}
    """
    
    current_time = datetime.now().strftime("%Y-%m-%d %A")
    formatted_prompt = system_prompt.format(current_time=current_time)
    
    # If the user intent was classified as data but no results were found,
    # we still let Gemini explain this nicely to the user.
    no_results = not query_results.get("results") and not query_results.get("summary")
    
    data_intents = ["expense_summary", "invoice_search", "invoice_detail", "invoice_status", "finance_report", "budget_query"]
    intent = query_results.get("query_meta", {}).get("intent")
    is_data_query = intent in data_intents

    # Pre-process query results to make it easier for Gemini to see missing data
    sanitized_results = query_results.copy()
    if sanitized_results.get("error") == "Unknown intent or insufficient permissions" and not is_data_query:
        del sanitized_results["error"]
    
    if no_results and is_data_query:
        sanitized_results["info"] = "No matching records found in the database for this specific request."

    history = context.get("history", []) if context else []
    history_str = "\n".join([f"{msg['role'].title()}: {msg['content']}" for msg in history])

    user_content = f"""
    Recent Conversation History:
    {history_str}
    
    User Query: {user_query}
    
    Query Results:
    {json.dumps(sanitized_results, indent=2, default=str)}
    
    Please provide a concise summary for the user.
    """

    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=user_content,
            config=types.GenerateContentConfig(
                system_instruction=formatted_prompt,
                temperature=0.4
            )
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Response generation failed: {e}")
        return "Sorry, I'm having trouble providing a summary right now."
