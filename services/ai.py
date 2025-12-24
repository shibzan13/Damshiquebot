import httpx
import asyncio
import json
import re
from datetime import datetime
from config import OPENROUTER_API_KEY, OPENROUTER_MODEL, USE_LOCAL_AI, OLLAMA_BASE_URL, OLLAMA_MODEL
from services.whatsapp import send_whatsapp_message, send_whatsapp_document
from services.db import get_expenses_for_user, set_budget, get_budget
from services.excel import generate_excel_report
from services.chat_history import save_chat_message, get_chat_history
from services.rag import TOOLS

async def call_llm(messages, temperature=0.7, json_mode=False):
    """Unified caller with automatic fallback: Ollama -> OpenRouter"""
    if USE_LOCAL_AI:
        try:
            return await call_ollama(messages, temperature, json_mode)
        except Exception as e:
            print(f"⚠️ Local AI failed: {e}. Falling back to OpenRouter...")
    
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": messages,
        "temperature": temperature
    }
    if json_mode and ("mistral" in OPENROUTER_MODEL or "gpt" in OPENROUTER_MODEL):
        payload["response_format"] = {"type": "json_object"}
            
    return await call_openrouter_with_retry(payload)

async def call_ollama(messages, temperature=0.7, json_mode=False):
    url = f"{OLLAMA_BASE_URL}/api/chat"
    payload = {"model": OLLAMA_MODEL, "messages": messages, "stream": False, "options": {"temperature": temperature}}
    if json_mode: payload["format"] = "json"
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, timeout=60.0)
        resp.raise_for_status()
        data = resp.json()
        return {"choices": [{"message": data["message"]}]}

async def call_openrouter_with_retry(payload, max_retries=5):
    headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json", "HTTP-Referer": "https://whatsapp-expense-bot"}
    async with httpx.AsyncClient() as client:
        for r in range(max_retries):
            try:
                resp = await client.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers, timeout=60.0)
                if resp.status_code in [429, 503]:
                    await asyncio.sleep(2 ** r)
                    continue
                resp.raise_for_status()
                return resp.json()
            except Exception as e:
                if r == max_retries - 1: raise e
                await asyncio.sleep(1)

def build_monthly_summary(expenses):
    summary = {}
    for e in expenses:
        date_str = e.get('date') or e.get('created_at', '')
        if len(date_str) >= 7:
            month_key = date_str[:7]
            cur = e.get('currency', 'UNKNOWN')
            if month_key not in summary: summary[month_key] = {}
            summary[month_key][cur] = summary[month_key].get(cur, 0) + float(e.get('amount', 0))
    lines = [f"- {m}: {', '.join([f'{a:.2f} {c}' for c, a in sorted(t.items())])}" for m, t in sorted(summary.items(), reverse=True)]
    return "\n".join(lines) if lines else "No spending history."

async def handle_agentic_query(from_number, user_message, summary):
    history = await get_chat_history(from_number, limit=5)
    agent_prompt = (
        "You are an AI Expense Agent. Use these ACTIONS to help the user:\n"
        "1. ACTION: search_expenses('keyword')\n"
        "2. ACTION: search_documents('keyword')\n"
        "3. ACTION: get_spend_summary()\n\n"
        "If you need more info from the DB, use an ACTION. Otherwise, talk to the user.\n"
        f"CONTEXT: {summary}"
    )
    messages = [{"role": "system", "content": agent_prompt}]
    for h in history: messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_message})

    resp = await call_llm(messages, temperature=0.1)
    content = resp["choices"][0]["message"]["content"]

    action_match = re.search(r"ACTION:\s*(\w+)\((.*)\)", content)
    if action_match:
        tool, arg = action_match.group(1), action_match.group(2).strip("'\"")
        if tool in TOOLS:
            print(f"🛠 Agent executing {tool}...")
            obs = await TOOLS[tool](from_number) if tool == "get_spend_summary" else await TOOLS[tool](arg, from_number)
            messages.append({"role": "assistant", "content": content})
            messages.append({"role": "system", "content": f"OBSERVATION: {json.dumps(obs)}"})
            final = await call_llm(messages, temperature=0.7)
            return final["choices"][0]["message"]["content"]
    return content

async def handle_text_query(from_number, user_message):
    try:
        await save_chat_message(from_number, "user", user_message)
        expenses = await get_expenses_for_user(from_number)
        summary = build_monthly_summary(expenses)
        
        if user_message.lower().strip() in ["help", "menu"]:
            resp = "*👋 WhatsApp Expense Assistant*\n- Chat to save expenses\n- Send images for OCR\n- Type 'report' for Excel"
        else:
            resp = await handle_agentic_query(from_number, user_message, summary)
            
        await send_whatsapp_message(from_number, resp)
        await save_chat_message(from_number, "assistant", resp)
    except Exception as e:
        print(f"❌ Error: {e}")
        await send_whatsapp_message(from_number, "⚠️ Encountered an error.")

async def parse_expense_from_text(text):
    if not text: return None
    messages = [
        {"role": "system", "content": "Extract expense JSON: {merchant, amount, currency, date, category}"},
        {"role": "user", "content": text}
    ]
    try:
        resp = await call_llm(messages, temperature=0, json_mode=True)
        return json.loads(re.search(r"(\{.*\})", resp["choices"][0]["message"]["content"]).group(1))
    except: return None
