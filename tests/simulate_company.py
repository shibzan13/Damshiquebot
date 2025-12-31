import asyncio
import os
import sys
sys.path.append(os.getcwd())
import json
from unittest.mock import AsyncMock, patch
from storage.db import init_storage, add_user, store_expense, list_all_expenses
from agent_orchestrator.orchestrator import run_agent_loop
from datetime import datetime

# Mocking WhatsApp and AI tools to avoid API calls during test
async def mock_send_whatsapp(phone, message):
    print(f"\n[WA TO {phone}]: {message}")

async def mock_upload_media(path, mime):
    print(f"[WA UPLOAD]: {path} ({mime})")
    return "mock_media_id_123"

async def mock_send_doc(phone, media_id, filename, caption):
    print(f"[WA DOC TO {phone}]: {filename} - {caption}")

async def mock_format_gemini(report_type, data):
    return f"MOCK GEMINI REPLY for {report_type}: {json.dumps(data, indent=2)}"

async def simulate():
    print("🚀 Starting Company Simulation Test...")
    await init_storage()
    
    # 1. Setup Company Users
    users = [
        {"phone": "123", "name": "Alice (CEO)", "role": "admin", "dept": "Exec"},
        {"phone": "456", "name": "Bob", "role": "employee", "dept": "Sales"},
        {"phone": "789", "name": "Charlie", "role": "employee", "dept": "Tech"},
        {"phone": "000", "name": "David", "role": "employee", "dept": "Sales"}
    ]
    
    for u in users:
        await add_user(u['phone'], u['name'], u['role'], u['dept'])
        print(f"✅ Added User: {u['name']} ({u['role']})")

    # 2. Simulate Employees Submitting Expenses (Direct DB injection for speed)
    print("\n📦 Simulating expense submissions...")
    test_expenses = [
        ("456", {"merchant": "Starbucks", "amount": 25.50, "currency": "AED", "date": "2025-12-01", "category": "Food"}),
        ("456", {"merchant": "Uber", "amount": 45.00, "currency": "AED", "date": "2025-12-05", "category": "Transport"}),
        ("789", {"merchant": "AWS", "amount": 150.00, "currency": "USD", "date": "2025-12-10", "category": "Infrastructure"}),
        ("000", {"merchant": "Office Depot", "amount": 89.99, "currency": "AED", "date": "2025-12-15", "category": "Office"})
    ]
    
    for phone, exp in test_expenses:
        await store_expense(phone, exp, "raw text", 0.99, "PASS", "media_id_fixed")
        print(f"💰 {phone} submitted expense: {exp['merchant']}")

    # 3. Simulate Commands
    with patch('agent_orchestrator.orchestrator.send_whatsapp', side_effect=mock_send_whatsapp), \
         patch('agent_orchestrator.orchestrator.upload_media', side_effect=mock_upload_media), \
         patch('agent_orchestrator.orchestrator.send_whatsapp_document', side_effect=mock_send_doc), \
         patch('agent_orchestrator.orchestrator.format_with_gemini', side_effect=mock_format_gemini):

        print("\n--- EMPLOYEE TESTING ---")
        # Alice (Admin) can see her own
        print("\n> Bob asks for his totals:")
        await run_agent_loop("456", text_message="my month total")
        
        print("\n> Charlie asks for his expenses:")
        await run_agent_loop("789", text_message="my month expenses")

        print("\n--- ADMIN TESTING ---")
        print("\n> CEO Alice asks for Month Summary:")
        await run_agent_loop("123", text_message="month summary")
        
        print("\n> CEO Alice asks for Month by Person:")
        await run_agent_loop("123", text_message="month by person")

        print("\n> CEO Alice asks for Month by Category:")
        await run_agent_loop("123", text_message="month by category")

        print("\n> CEO Alice requests Export:")
        await run_agent_loop("123", text_message="export month")

        print("\n> CEO Alice drills down on Bob:")
        await run_agent_loop("123", text_message="Bob this month")

        print("\n--- PERMISSION TESTING ---")
        print("\n> Bob (Employee) tries Admin command:")
        await run_agent_loop("456", text_message="month by person")

    print("\n✅ Simulation Complete.")

if __name__ == "__main__":
    asyncio.run(simulate())
