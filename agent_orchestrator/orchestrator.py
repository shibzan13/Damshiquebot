import json
import os
import logging
from tools.document_tools.llama_cloud_parser import llama_cloud_extract
from tools.document_tools.ocr_tools import render_pdf_to_images, preprocess_image, ocr_paddle
from tools.document_tools.extraction_tools import (
    extract_candidates, 
    gemini_structured_extract, 
    deterministic_parse, 
    validate_expense,
    normalize_extraction
)
from tools.messaging_tools.whatsapp import send_whatsapp, upload_media, send_whatsapp_document
from tools.export_tools import generate_custom_export
from storage.postgres_repository import (
    persist_invoice_intelligence, 
    log_activity, 
    get_system_user, 
    create_user_request,
    log_bot_interaction
)
from tools.storage_tools.s3_storage import save_raw_invoice
from storage.analytics import get_current_month_range

from tools.conversation_tools.intent_classifier import classify_bot_intent
from tools.conversation_tools.context_manager import get_conversation_context, update_conversation_context, log_conversation_message
from tools.conversation_tools.response_generator import generate_bot_response
from tools.query_engine import QueryEngine
from tools.notification_engine import NotificationEngine
from tools.finance_tools.validation_engine import ValidationEngine
from tools.sheet_tools import append_invoice_to_sheet

logger = logging.getLogger(__name__)

async def run_agent_loop(user_phone, text_message=None, media_path=None, mime_type=None, document_id=None):
    if not text_message and not media_path:
        return

    # 0. User Lookup & Permission Check (Postgres)
    user = await get_system_user(user_phone)
    
    # Context Resolution
    context = await get_conversation_context(user_phone)
    
    # 1. Handle Unapproved Users
    if not user or not user.get('is_approved'):
        admin_token_env = os.getenv("ADMIN_TOKEN")
        
        # Admin Token Bypass (Auto-approval)
        if text_message and admin_token_env and text_message.strip() == admin_token_env:
            from storage.postgres_repository import approve_user_request, create_user_request
            await create_user_request(user_phone, "Admin User", "Auto-approved via token")
            await approve_user_request(user_phone, role="admin")
            await send_whatsapp(user_phone, "🔓 Master Key Accepted! Your account has been auto-approved as ADMIN. How can I help you today?")
            return

        # If user is not approved, they can ONLY request access.
        if text_message:
            classification = await classify_bot_intent(text_message, context)
            intent = classification.get("intent")
            if intent == "request_access":
                name = classification.get("entities", {}).get("user_name", "Unknown User")
                success = await create_user_request(user_phone, name, text_message)
                if success:
                    await send_whatsapp(user_phone, f"👋 Hi {name}! Your request to join the system has been sent to the admin. You'll be notified once approved.")
                else:
                    await send_whatsapp(user_phone, "❌ Sorry, I couldn't process your request right now. Please try again later.")
                return

        # Default block message
        msg = "🚫 You are not registered or approved in the system. To request access, please send a message with your name (e.g., 'I am John Smith, requesting access'). Or send your ADMIN_TOKEN to auto-approve."
        await send_whatsapp(user_phone, msg)
        return

    role = user.get('role', 'employee')
    user_name = user.get('name', 'User')

    # Identifiers for logs
    print(f"🤖 Agent AI: Handling request for {user_phone} ({user_name}, {role})")

    # 2. Handle Media (Invoices)
    if media_path:
        return await handle_media_extraction(user_phone, user_name, media_path, mime_type, document_id)
    
    # 3. Handle Text Queries
    if text_message:
        # Log User Message
        await log_conversation_message(user_phone, "user", text_message)
        
        classification = await classify_bot_intent(text_message, context)
        intent = classification.get("intent", "unknown")
        entities = classification.get("entities", {})
        
        print(f"🤖 Agent AI: Classified Intent: {intent}")

        # Resolve Reference entities
        if entities.get("reference") in ["last", "this", "that"] and context.get("last_invoice_id"):
            entities["invoice_id"] = context["last_invoice_id"]

        # 4. Database Query Engine
        query_results = await QueryEngine.execute_query(user_phone, role, intent, entities)
        
        # 5. Handle File Exports (WhatsApp specific)
        if "export_file" in query_results and query_results["export_file"]:
            file_path = query_results["export_file"]
            from tools.messaging_tools.whatsapp import upload_media, send_whatsapp_document
            media_id = await upload_media(file_path, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            if media_id:
                await send_whatsapp_document(user_phone, media_id, os.path.basename(file_path), "Here is your requested expense export.")
                response = "✅ I've sent the Excel sheet to you above."
            else:
                response = "❌ I generated the report but failed to upload it. Please try again later."
        elif intent == "help":
            response = "I can help you track expenses. You can ask for summaries, search for invoices, or ask about invoice statuses."
        elif intent == "unknown":
            # Fallback to general chat if intent is unknown but maybe it's chat
            # But we added 'chat' intent, so 'unknown' really means unknown.
            # However, for robustness, let's treat unknown as potential chat too.
            response = await generate_bot_response(text_message, {"results": [], "query_meta": {"intent": "chat"}}, context)
        else:
            response = await generate_bot_response(text_message, query_results, context)

        # 6. Update Context (Memory enhancement)
        new_last_id = None
        if intent == "invoice_detail" and query_results.get("summary"):
            new_last_id = str(query_results["summary"]["invoice_id"])
        elif intent == "invoice_search" and query_results.get("results"):
             new_last_id = str(query_results["results"][0]["invoice_id"])
            
        await update_conversation_context(user_phone, last_invoice_id=new_last_id, last_query_type=intent)
        
        # Send & Log Bot Response
        await send_whatsapp(user_phone, response)
        await log_conversation_message(user_phone, "bot", response)
        
        # 7. Log Activity
        await log_bot_interaction(user_phone, text_message, response, intent, 1.0, "whatsapp")

async def handle_media_extraction(user_phone, user_name, file_path, mime_type, document_id=None):
    # 0. Try Premium Extraction
    print(f"💎 Attempting Llama Cloud extraction for {user_phone}...")
    llama_res = await llama_cloud_extract(file_path)
    
    full_text = ""
    if llama_res and llama_res.get("raw_text"):
        full_text = llama_res["raw_text"]
    else:
        # Fallback to standard OCR
        images = render_pdf_to_images(file_path) if mime_type == "application/pdf" else [file_path]
        for img in images:
            proc = preprocess_image(img)
            ocr_res = ocr_paddle(proc)
            full_text += ocr_res["raw_text"] + "\n"
        
    candidates = extract_candidates(full_text)
    extraction_res = await gemini_structured_extract(full_text, candidates, doc_path=file_path)
    
    if not extraction_res:
        extraction_res = deterministic_parse(full_text, candidates)
        
    invoice_intelligence = normalize_extraction(extraction_res)
    compliance_results = ValidationEngine.validate_invoice(invoice_intelligence)

    # 4.5. Generate Embedding for Semantic Search
    from tools.document_tools.extraction_tools import generate_embedding
    embedding_text = f"{invoice_intelligence.get('vendor_name', '')} {full_text[:2000]}"
    embedding = await generate_embedding(embedding_text)

    # 5. Store & Reply
    if invoice_intelligence.get("total_amount"):
        file_url = await save_raw_invoice(file_path, user_phone)
        
        # Persist to Postgres with embedding
        invoice_uuid = await persist_invoice_intelligence(
            user_id=user_phone,
            invoice_data=invoice_intelligence,
            file_url=file_url,
            whatsapp_media_id=document_id,
            compliance_results=compliance_results,
            embedding=embedding if embedding else None
        )

        if invoice_uuid:
            # SYNC TO GOOGLE SHEETS
            sheet_data = {**invoice_intelligence, "file_url": file_url, "status": "pending"}
            await append_invoice_to_sheet(sheet_data)
            
            # Notifications
            await NotificationEngine.trigger_event(user_phone, "invoice_received", invoice_intelligence)
            
            # Compliance issues
            for flag in compliance_results.get("compliance_flags", []):
                if flag["severity"] == "error":
                    await NotificationEngine.trigger_event(user_phone, "invoice_rejected", {"vendor_name": invoice_intelligence['vendor_name'], "reason": flag['message']})
            
            await update_conversation_context(user_phone, last_invoice_id=str(invoice_uuid), last_query_type="invoice_upload")
            
        else:
             await NotificationEngine.trigger_event(user_phone, "duplicate_detected", invoice_intelligence)
    else:
        await send_whatsapp(user_phone, "❌ Sorry, I couldn't extract any expense data from that file. Please make sure the image is clear.")
