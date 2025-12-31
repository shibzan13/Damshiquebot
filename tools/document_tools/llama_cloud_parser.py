import os
import json
from llama_parse import LlamaParse
from datetime import datetime
import re
from pathlib import Path

LLAMA_CLOUD_API_KEY = os.getenv("LLAMA_CLOUD_API_KEY", "llx-G5AgizBunfzBHleA2yDYbTAisHmzTpIwSMuIB2b7vMMAxEIr")

async def llama_cloud_extract(file_path):
    """
    Use LlamaParse for high-quality extraction from documents
    """
    global LLAMA_CLOUD_API_KEY
    if not LLAMA_CLOUD_API_KEY:
        LLAMA_CLOUD_API_KEY = os.getenv("LLAMA_CLOUD_API_KEY")

    if not LLAMA_CLOUD_API_KEY:
        print("⚠️ Llama Cloud API Key missing")
        return None
        
    try:
        print(f"🦙 Llama Cloud parsing: {file_path}")
        
        # Create extraction prompt
        extraction_prompt = """
        Extract the following details from this receipt or invoice:
        - Merchant name
        - Total amount
        - Currency
        - Date of transaction
        - List of items (if available)
        
        Focus on finding the absolute total paid. 
        If the document contains multiple pages, combine the information.
        """

        # Initialize parser with updated API
        parser = LlamaParse(
            api_key=LLAMA_CLOUD_API_KEY,
            result_type="markdown",
            verbose=True,
            gpt4o_mode=True,  # Enable premium/gpt4o mode (must be boolean)
            parsing_instruction=extraction_prompt
        )
        
        # Process the file
        documents = await parser.aload_data(file_path)
        
        if not documents:
            print("⚠️ Llama Cloud returned no documents")
            return None
            
        # Combine text from all pages
        full_text = "\n\n".join([doc.text for doc in documents if hasattr(doc, 'text')])
        
        # Get file metadata
        file_name = Path(file_path).name
        file_size = os.path.getsize(file_path)
        
        print(f"✅ Llama Cloud processed {file_name} ({file_size} bytes)")
        
        return {
            "raw_text": full_text,
            "engine": "llama_cloud",
            "file_name": file_name,
            "file_size": file_size,
            "processed_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Llama Cloud Error: {e}")
        return None
