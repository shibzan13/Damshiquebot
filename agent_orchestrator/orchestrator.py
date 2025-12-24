import json
import os
from tools.document_tools.llama_cloud_parser import llama_cloud_extract
from tools.document_tools.ocr_tools import render_pdf_to_images, preprocess_image, ocr_paddle
from tools.document_tools.extraction_tools import extract_candidates, gemini_structured_extract, deterministic_parse, validate_expense
from storage.db import store_expense, list_expenses, totals_expenses, clear_expenses, verify_clear
from tools.conversation_tools.state import set_pending_action, get_pending_action, clear_pending_action
from tools.messaging_tools.whatsapp import send_whatsapp

async def classify_intent(text):
    text = text.upper().strip()
    if text == "YES": return "CLEAR_EXPENSES_CONFIRM_YES"
    if "CLEAR" in text: return "CLEAR_EXPENSES_REQUEST"
    if any(k in text for k in ["TOTAL", "SUM", "SPENT"]): return "TOTALS_THIS_MONTH"
    if any(k in text for k in ["LIST", "SHOW", "EXPENSES"]): return "LIST_EXPENSES_THIS_MONTH"
    if any(k in text for k in ["HELP", "START"]): return "HELP"
    return "ADD_EXPENSE_FROM_TEXT"

async def run_agent_loop(user_phone, text_message=None, media_path=None, mime_type=None):
    if not text_message and not media_path:
        print(f"⚠️ Empty message from {user_phone}, skipping.")
        return

    # 1. Determine Intent
    if media_path:
        intent = "ADD_EXPENSE_FROM_MEDIA"
    else:
        intent = await classify_intent(text_message)
    
    print(f"🤖 Processing Intent: {intent} for {user_phone}")

    if intent == "ADD_EXPENSE_FROM_MEDIA":
        return await handle_media_extraction(user_phone, media_path, mime_type)
        
    elif intent == "LIST_EXPENSES_THIS_MONTH":
        expenses = await list_expenses(user_phone)
        if not expenses:
            await send_whatsapp(user_phone, "You have no expenses recorded yet.")
        else:
            msg = "📋 Your Recent Expenses:\n"
            for e in expenses[:10]:
                msg += f"- {e['date']} | {e['merchant']}: {e['amount']} {e['currency']}\n"
            await send_whatsapp(user_phone, msg)
            
    elif intent == "TOTALS_THIS_MONTH":
        totals = await totals_expenses(user_phone)
        msg = "📊 Your Spending Totals:\n"
        for t in totals['totals']:
            msg += f"- {t['currency']}: {t['total']:.2f} ({t['count']} items)\n"
        await send_whatsapp(user_phone, msg)
        
    elif intent == "CLEAR_EXPENSES_REQUEST":
        await set_pending_action(user_phone, "CLEAR_EXPENSES", {}, ttl_minutes=10)
        await send_whatsapp(user_phone, "⚠️ This will delete ALL your expenses. Reply 'YES' to confirm.")
        
    elif intent == "CLEAR_EXPENSES_CONFIRM_YES":
        pending = await get_pending_action(user_phone)
        if pending and pending["action_type"] == "CLEAR_EXPENSES":
            await clear_expenses(user_phone)
            verify = await verify_clear(user_phone)
            if verify["remaining_count"] == 0:
                await clear_pending_action(user_phone)
                await send_whatsapp(user_phone, "✅ All expenses cleared successfully.")
            else:
                await send_whatsapp(user_phone, f"⚠️ Error: {verify['remaining_count']} items remain. Clearance failed.")
        else:
            await send_whatsapp(user_phone, "No pending clear request or it has expired.")
            
    elif intent == "HELP":
        help_msg = """🤖 *Expense Bot Help*
- Send a photo/PDF of a receipt to track it.
- Type 'List' to see expenses.
- Type 'Totals' for summary.
- Type 'Clear' to delete all data."""
        await send_whatsapp(user_phone, help_msg)
    
    elif intent == "ADD_EXPENSE_FROM_TEXT":
        # Simplified: just chat or attempt parse
        await send_whatsapp(user_phone, "I received your message. Send an image to track an expense, or try 'List' or 'Totals'.")

async def handle_media_extraction(user_phone, file_path, mime_type):
    # 0. Try Llama Cloud first (Premium Extraction)
    print(f"💎 Attempting Llama Cloud extraction for {user_phone}...")
    llama_res = await llama_cloud_extract(file_path)
    
    full_text = ""
    extraction_engine = "paddleocr"
    
    if llama_res and llama_res.get("raw_text"):
        full_text = llama_res["raw_text"]
        extraction_engine = "llama_cloud"
        print(f"✅ Llama Cloud extraction successful ({len(full_text)} chars)")
    else:
        # 1. Fallback to Standard OCR Pipeline
        print("⚠️ Llama Cloud failed or skipped, using PaddleOCR fallback")
        images = []
        if mime_type == "application/pdf":
            images = render_pdf_to_images(file_path)
        else:
            images = [file_path]
            
        for img in images:
            proc = preprocess_image(img)
            ocr_res = ocr_paddle(proc)
            full_text += ocr_res["raw_text"] + "\n"
        
    # 2. Extract Candidates from text
    candidates = extract_candidates(full_text)
    
    # 3. Gemini Structure (passing file_path for Vision/PDF context)
    expense = await gemini_structured_extract(full_text, candidates, doc_path=file_path)
    
    if not expense:
        expense = deterministic_parse(full_text, candidates)
        
    # 4. Validate
    val = validate_expense(expense, full_text, candidates)
    
    # 5. Store & Reply
    if val["status"] == "PASS":
        # Record which engine was used in the notes
        expense["notes"] = f"{expense.get('notes', '')} (Engine: {extraction_engine})".strip()
        
        eid = await store_expense(user_phone, expense, full_text, val["confidence"], "PASS")
        msg = f"✅ Saved: {expense['merchant']}\n💰 Amount: {expense['amount']} {expense['currency']}\n📅 Date: {expense['date']}\n📂 Category: {expense['category']}"
        await send_whatsapp(user_phone, msg)
    elif val["status"] == "NEEDS_REVIEW":
        await store_expense(user_phone, expense, full_text, val["confidence"], "NEEDS_REVIEW")
        await send_whatsapp(user_phone, f"📝 Added (Needs Review):\n{expense['merchant']} - {expense['amount']} {expense['currency']}\nIs this correct?")
    else:
        await send_whatsapp(user_phone, "❌ Sorry, I couldn't extract data from this file. Please try a clearer photo or send a message with the details.")
