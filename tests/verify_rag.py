import asyncio
import os
import sys
import logging

# Add project root to path
sys.path.append(os.getcwd())

from storage.postgres_repository import (
    get_db_connection, 
    persist_invoice_intelligence,
    get_system_user,
    approve_user_request,
    create_user_request
)
from tools.query_engine import QueryEngine
from tools.conversation_tools.response_generator import generate_bot_response
from tools.document_tools.extraction_tools import generate_embedding

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def verify():
    print("🧪 Starting Vector Search & RAG Verification...")
    
    test_phone = "test_user_123"
    
    # 1. Setup Test User
    print("👤 Setting up test user...")
    await create_user_request(test_phone, "Test Runner", "test_runner", "pass", "Testing RAG")
    await approve_user_request(test_phone, role="admin")
    
    # 2. Prepare Sample Data
    print("📝 Preparing sample document data...")
    sample_text = """
    DAMSHIQUE LUXURY SERVICES
    Invoice #9999
    Date: 2026-01-04
    
    Items:
    1. Gold-Plated Pen - 500 AED
    2. Silk Notebook - 200 AED
    
    Total: 700 AED
    
    NOTES: 
    This document was signed by Agent Zero.
    The return policy for Damshique Luxury items is 48 hours for store credit only.
    No cash refunds.
    """
    
    invoice_data = {
        "merchant": "Damshique Luxury Services",
        "amount": 700.0,
        "currency": "AED",
        "date": "2026-01-04",
        "category": "Office",
        "subtotal": 700.0,
        "tax_amount": 0.0,
        "vendor_name": "Damshique Luxury Services",
        "invoice_date": "2026-01-04",
        "line_items_status": "extracted",
        "confidence_score": 1.0,
        "line_items": [
            {"description": "Gold-Plated Pen", "quantity": 1, "unit_price": 500.0, "tax": 0.0, "line_total": 500.0},
            {"description": "Silk Notebook", "quantity": 1, "unit_price": 200.0, "tax": 0.0, "line_total": 200.0}
        ]
    }
    
    # Generate real embedding if possible
    print("🧠 Generating embedding for sample text...")
    embedding = await generate_embedding(f"Damshique Luxury Services {sample_text[:1000]}")
    
    if not embedding:
        print("❌ Failed to generate embedding. Vector search will rely on fallback.")
    
    # 3. Persist with raw text
    print("💾 Persisting invoice with raw text...")
    invoice_id = await persist_invoice_intelligence(
        user_id=test_phone,
        invoice_data=invoice_data,
        file_url="http://example.com/mock_invoice.pdf",
        whatsapp_media_id="mock_id",
        embedding=embedding if embedding else None,
        raw_text=sample_text
    )
    
    if not invoice_id:
        print("❌ Failed to persist invoice.")
        return

    print(f"✅ Invoice persisted: {invoice_id}")
    
    # 4. Test Semantic Search
    print("\n🔍 Testing Semantic Search (Query: 'What is the return policy?')...")
    query = "What is the return policy?"
    entities = {"search_query": query}
    
    results = await QueryEngine.execute_query(test_phone, "admin", "semantic_search", entities)
    
    if "results" in results and len(results["results"]) > 0:
        print(f"✅ Found {len(results['results'])} matches.")
        match = results["results"][0]
        print(f"   Match Score (Similarity): {match.get('similarity', 0):.2f}%")
        
        if match.get("raw_text"):
             print("✅ Raw text retrieved successfully.")
        else:
             print("❌ Raw text missing from retrieved match.")
             
        # 5. Test RAG Response
        print("\n🤖 Testing Response Generation (RAG)...")
        response = await generate_bot_response(query, results, {"history": []})
        print(f"\n[BOT RESPONSE]:\n{response}\n")
        
        if "48 hours" in response or "store credit" in response:
            print("💎 SUCCESS: Bot answered a granular question using raw document text!")
        else:
            print("⚠️ WARNING: Bot response did not contain the specific information from the raw text.")
            
    else:
        print(f"❌ Semantic search failed or returned no results: {results}")

if __name__ == "__main__":
    asyncio.run(verify())
