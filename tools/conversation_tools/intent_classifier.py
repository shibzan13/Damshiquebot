import json
import logging
from typing import Dict, Any, Optional
from tools.document_tools.extraction_tools import get_gemini_client
from google.genai import types
from datetime import datetime

logger = logging.getLogger(__name__)

async def classify_bot_intent(user_query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Step 2: Intent Classification (LLM – Controlled)
    Uses LLM only to classify intent and extract entities into strict JSON.
    """
    client = get_gemini_client()
    if not client:
        return {"intent": "unknown", "entities": {}}

    system_prompt = """You are an intent classifier for a WhatsApp Invoice Bot.
    Your task is to analyze the user query and optional conversation context to determine the intent and extract relevant entities.
    
    Allowed Intents:
    - expense_summary: Querying total spend or spend breakdown (e.g., "How much did I spend this month?"). IMPORTANT: If the user asks for a CHART, PIE CHART, BAR CHART, or GRAPH, this is the correct intent.
    - invoice_search: Searching for specific invoices (e.g., "Show my Amazon invoices", "Invoices above 500 AED")
    - semantic_search: Natural language search through invoice content or asking specific questions about documents (e.g., "Find that receipt with a blue logo", "What is the return policy on the last Apple receipt?", "Who signed the delivery note from yesterday?")
    - invoice_detail: Asking for details about a specific invoice (e.g., "Break down the last invoice")
    - invoice_status: Checking the status of an invoice (e.g., "Why is my invoice pending?")
    - finance_report: Requesting periodic/compliance reports (e.g., "Quarterly spend report", "Show me anomalous vendors")
    - budget_query: Checking budget utilization (e.g., "What is the budget status for Marketing?")
    - recurring_query: Querying subscriptions or recurring expenses (e.g., "What are my recurring charges?", "List my subscriptions")
    - predictive_query: Asking for forecasts or budget tracking predictions (e.g., "Am I on track for my budget?", "Predict my next month spend")
    - finance_export: Requesting a FILE download like Excel/CSV (e.g., "Send me the excel sheet", "Export to csv", "Download expenses"). NOTE: If user asks for a CHART or GRAPH, use expense_summary instead!
    - clear_data: When the user wants to delete their expenses (e.g., "clear my expenses", "reset my database", "delete all my records")
    - request_access: When a user wants to join the system (e.g., "I'm John Smith, I want to use the bot", "Please approve me, I'm from Finance")
    - chat: General conversation, greetings, jokes, or non-finance questions (e.g., "Hello", "How are you?", "Tell me a joke").
    - help: Asking for help.
    - unknown: Use if the intent is unclear.

    Entities to extract:
    - user_name: The name of the user (e.g., "John Smith").
    - date_range: "this_month", "last_month", "today", "yesterday", or a specific date.
    - category: The category of expense (e.g., "taxi", "food").
    - vendor: The merchant/vendor name.
    - amount_filter: Comparison like ">500", "<100", "500".
    - status: "pending", "approved", "rejected".
    - reference: "last", "this", "that" (for context resolution).
    - search_query: Full natural language search query for semantic_search intent.

    Rules:
    1. Output ONLY strict JSON.
    2. If intent is unclear, use "unknown".
    3. Use the context to resolve values like "that invoice" if possible.
    4. CRITICAL: Keywords like "chart", "graph", "pie chart", "bar chart", "visualization" should trigger expense_summary, NOT finance_export!
    
    Context:
    Last Invoice ID: {last_invoice_id}
    Last Query Type: {last_query_type}
    """
    
    context_data = context or {}
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_system_prompt = system_prompt.format(
        last_invoice_id=context_data.get("last_invoice_id", "none"),
        last_query_type=context_data.get("last_query_type", "none")
    ) + f"\n\nCRITICAL INFO: The current date and time is {current_time}. Use this to resolve 'today', 'yesterday', 'this month', or relative searches."

    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=user_query,
            config=types.GenerateContentConfig(
                system_instruction=formatted_system_prompt,
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        
        result = json.loads(response.text)
        return result
    except Exception as e:
        logger.error(f"Intent classification failed: {e}")
        return {"intent": "unknown", "entities": {}}
