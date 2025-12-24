"""
Message Handler - Updated to use Gemini-only AI
"""
from services.whatsapp import send_whatsapp_message, download_media, mark_message_as_read
from services.gemini_ai import chat_with_context, extract_expense_from_text, extract_expense_from_image, analyze_spending_pattern
from services.images import save_image
from services.pdfs import save_pdf
from services.chat_history import save_chat_message, get_chat_history
from services.db import clear_user_expenses, get_expenses_for_user, insert_expenses
import os

def build_expense_context(expenses):
    """Build context string from expenses"""
    if not expenses:
        return "No expenses recorded yet."
    
    # Get summary
    total_by_currency = {}
    categories = {}
    
    for exp in expenses:
        cur = exp.get('currency', 'AED')
        cat = exp.get('category', 'Other')
        amt = float(exp.get('amount', 0))
        
        total_by_currency[cur] = total_by_currency.get(cur, 0) + amt
        categories[cat] = categories.get(cat, 0) + amt
    
    context = f"Total expenses: {len(expenses)}\n"
    context += "Totals by currency: " + ", ".join([f"{amt:.2f} {cur}" for cur, amt in total_by_currency.items()]) + "\n"
    context += "Top categories: " + ", ".join([f"{cat}: {amt:.2f}" for cat, amt in sorted(categories.items(), key=lambda x: x[1], reverse=True)[:3]])
    
    # Add recent expenses
    context += "\n\nRecent expenses:\n"
    for exp in expenses[:5]:
        context += f"- {exp.get('date')}: {exp.get('merchant')} - {exp.get('amount')} {exp.get('currency')}\n"
    
    return context

async def handle_incoming_message(message):
    from_number = message.get("from")
    msg_type = message.get("type")
    message_id = message.get("id")

    print(f"👉 New message from {from_number}, type: {msg_type}")

    if message_id:
        await mark_message_as_read(message_id)

    # TEXT handler
    if msg_type == "text":
        body = message.get("text", {}).get("body", "")
        print(f"💬 Text body: {body}")
        
        await save_chat_message(from_number, "user", body)
        
        # 🔥 COMMAND ROUTER (Deterministic - runs BEFORE AI)
        lower_body = body.lower().strip()
        
        # 🗑️ CLEAR COMMAND
        if lower_body in ["clear my expenses", "clear all my expenses", "delete all expenses", "reset expenses", "clear expenses"]:
            try:
                rows_deleted = await clear_user_expenses(from_number)
                remaining = await get_expenses_for_user(from_number, {"limit": 10})
                
                if len(remaining) == 0:
                    response = "✅ Done! I've deleted all your expenses from the database."
                else:
                    response = "⚠️ I tried to clear your expenses, but some data might still be remaining. Please try again."
                
                await send_whatsapp_message(from_number, response)
                await save_chat_message(from_number, "assistant", response)
            except Exception as e:
                print(f"❌ Clear error: {e}")
                await send_whatsapp_message(from_number, "❌ Error clearing expenses. Please try again later.")
            return
        
        # 📊 SHOW EXPENSES
        if lower_body in ["show expenses", "show my expenses", "list expenses", "my expenses"]:
            expenses = await get_expenses_for_user(from_number, {"limit": 10})
            
            if len(expenses) == 0:
                response = "You have no expenses recorded yet. Send me a receipt or type an expense!"
            else:
                lines = ["Here are your recent expenses:\n"]
                for e in expenses:
                    lines.append(f"• {e.get('date', 'N/A')}: {e.get('merchant', 'Unknown')} - {e.get('amount', 0)} {e.get('currency', 'AED')}")
                response = "\n".join(lines)
            
            await send_whatsapp_message(from_number, response)
            await save_chat_message(from_number, "assistant", response)
            return
        
        # 📈 ANALYZE SPENDING
        if lower_body in ["analyze", "analyze spending", "spending analysis", "insights"]:
            expenses = await get_expenses_for_user(from_number)
            analysis = await analyze_spending_pattern(expenses)
            
            await send_whatsapp_message(from_number, f"📊 Spending Analysis:\n\n{analysis}")
            await save_chat_message(from_number, "assistant", analysis)
            return
        
        # 💡 HELP
        if lower_body in ["help", "menu", "commands"]:
            response = """*💰 WhatsApp Expense Assistant*

*Commands:*
• Send receipts/invoices (images/PDFs)
• Type expenses: "Spent 50 AED at Starbucks"
• "show expenses" - View recent expenses
• "analyze" - Get spending insights
• "clear expenses" - Delete all expenses

*AI Features:*
• Ask questions about your spending
• Get financial advice
• Categorize expenses automatically

Just chat with me naturally! 🤖"""
            
            await send_whatsapp_message(from_number, response)
            await save_chat_message(from_number, "assistant", response)
            return
        
        # Try to extract expense from text
        expense_data = await extract_expense_from_text(body)
        
        if expense_data and expense_data.get('amount'):
            # Save expense
            await insert_expenses(from_number, [expense_data], "text")
            response = f"✅ Expense saved!\n\n{expense_data.get('merchant', 'Unknown')}: {expense_data.get('amount')} {expense_data.get('currency', 'AED')}\nDate: {expense_data.get('date', 'N/A')}\nCategory: {expense_data.get('category', 'Other')}"
            
            await send_whatsapp_message(from_number, response)
            await save_chat_message(from_number, "assistant", response)
            return
        
        # Default: AI chat
        expenses = await get_expenses_for_user(from_number)
        context = build_expense_context(expenses)
        history = await get_chat_history(from_number, limit=5)
        
        response = await chat_with_context(body, history, context)
        
        await send_whatsapp_message(from_number, response)
        await save_chat_message(from_number, "assistant", response)
        return

    # IMAGE handler
    if msg_type == "image":
        print(f"🖼 Image message: {message.get('image')}")
        media_id = message["image"]["id"]
        mime_type = message["image"]["mime_type"]
        
        file_path = await download_media(media_id, mime_type)
        if not file_path:
            await send_whatsapp_message(from_number, "Got your image but failed to download it ❌")
            return

        await save_chat_message(from_number, "user", f"[Sent an image: {mime_type}]")
        
        print("📋 Processing image with production pipeline...")
        
        # Use production-grade extraction pipeline
        from extractor import extract_expense
        extraction_result = await extract_expense(file_path, mime_type, from_number)
        
        # Save to database if extraction succeeded
        if extraction_result["status"] == "PASS" and extraction_result.get("amount"):
            expense_data = {
                "merchant": extraction_result.get("merchant", "Unknown"),
                "amount": extraction_result["amount"],
                "currency": extraction_result.get("currency", "AED"),
                "date": extraction_result.get("date"),
                "category": extraction_result.get("category", "Other")
            }
            
            await insert_expenses(from_number, [expense_data], "image", file_path)
            
            response = f"""✅ Receipt processed!

💰 Expense saved:
{expense_data['merchant']}: {expense_data['amount']} {expense_data['currency']}
Date: {expense_data['date']}
Category: {expense_data['category']}
Confidence: {extraction_result['confidence']:.0%}

💡 Ask me anything about your expenses!"""
        
        elif extraction_result["status"] == "NEEDS_REVIEW":
            # Save with lower confidence, but inform user
            if extraction_result.get("amount"):
                expense_data = {
                    "merchant": extraction_result.get("merchant", "Unknown"),
                    "amount": extraction_result["amount"],
                    "currency": extraction_result.get("currency", "AED"),
                    "date": extraction_result.get("date"),
                    "category": extraction_result.get("category", "Other")
                }
                
                await insert_expenses(from_number, [expense_data], "image", file_path)
                
                response = f"""⚠️ Receipt processed (needs review)

💰 Expense saved:
{expense_data['merchant']}: {expense_data['amount']} {expense_data['currency']}
Date: {expense_data['date']}

⚠️ Confidence: {extraction_result['confidence']:.0%}
Reason: {extraction_result.get('needs_review_reason', 'Low confidence')}

Please verify the amount is correct."""
            else:
                response = f"""⚠️ I processed your receipt but couldn't extract the amount automatically.

Reason: {extraction_result.get('needs_review_reason', 'Unclear receipt')}

Please type the amount manually, like: "Spent 50 AED at {extraction_result.get('merchant', 'Store Name')}\" """
        
        else:
            # Extraction failed
            response = f"""❌ I couldn't process this receipt automatically.

{extraction_result.get('notes', 'Please try a clearer photo or type the expense manually.')}

Type it like: "Spent 50 AED at Store Name" """
        
        await send_whatsapp_message(from_number, response)
        await save_chat_message(from_number, "assistant", response)
        return

    # DOCUMENT handler
    if msg_type == "document":
        print(f"📄 Document message: {message.get('document')}")
        media_id = message["document"]["id"]
        mime_type = message["document"]["mime_type"]
        filename = message["document"].get("filename", f"doc_{media_id}")
        
        file_path = await download_media(media_id, mime_type)
        if not file_path:
            await send_whatsapp_message(from_number, "Got your document but failed to download it ❌")
            return

        await save_chat_message(from_number, "user", f"[Sent a document: {filename}]")
        
        if filename.lower().endswith(".pdf") or mime_type == "application/pdf":
            print("📋 Processing PDF document...")
            
            # Use production-grade extraction pipeline
            from extractor import extract_expense
            extraction_result = await extract_expense(file_path, mime_type, from_number)
            
            if extraction_result["status"] == "PASS" and extraction_result.get("amount"):
                expense_data = {
                    "merchant": extraction_result.get("merchant", "Unknown"),
                    "amount": extraction_result["amount"],
                    "currency": extraction_result.get("currency", "AED"),
                    "date": extraction_result.get("date"),
                    "category": extraction_result.get("category", "Other")
                }
                
                await insert_expenses(from_number, [expense_data], "pdf", file_path)
                
                response = f"""✅ PDF processed!

💰 Expense saved:
{expense_data['merchant']}: {expense_data['amount']} {expense_data['currency']}
Date: {expense_data['date']}
Confidence: {extraction_result['confidence']:.0%}"""
            else:
                response = f"✅ PDF received ({filename}). Document saved to your knowledge base."
            
            await send_whatsapp_message(from_number, response)
            await save_chat_message(from_number, "assistant", response)
        else:
            await send_whatsapp_message(from_number, f"Received {filename}. I've stored it safely.")
        return

    # AUDIO handler
    if msg_type == "audio":
        await send_whatsapp_message(from_number, "🎤 Voice notes coming soon!")
        return

    # Fallback
    print(f"🤷 Unsupported message type: {msg_type}")
    await send_whatsapp_message(from_number, f"Received a {msg_type} message. I'm still learning how to handle these!")
