import asyncio
import os
import sys
import logging
import httpx
from pathlib import Path

# Add project root to path
sys.path.append(os.getcwd())

from storage.postgres_repository import (
    get_db_connection, 
)
from tools.document_tools.llama_cloud_parser import llama_cloud_extract
from tools.document_tools.ocr_tools import render_pdf_to_images, preprocess_image, ocr_paddle
from tools.document_tools.extraction_tools import generate_embedding

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from tools.storage_tools.s3_storage import storage_service

async def download_file(url, target_path):
    """Downloads a file from a URL to a local path (Supports authenticated S3)."""
    if "amazonaws.com" in url:
        try:
            # Extract key from URL
            parts = url.split(".amazonaws.com/")
            if len(parts) < 2: return False
            key = parts[1]
            
            print(f"📦 Downloading authenticated S3 object: {key}")
            os.makedirs(os.path.dirname(target_path), exist_ok=True)
            
            # Using boto3 client directly for internal download
            storage_service.s3_client.download_file(storage_service.bucket_name, key, target_path)
            return True
        except Exception as e:
            logger.error(f"S3 Direct download failed: {e}")
            return False
            
    # Fallback for standard HTTP
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if response.status_code == 200:
            os.makedirs(os.path.dirname(target_path), exist_ok=True)
            with open(target_path, "wb") as f:
                f.write(response.content)
            return True
        else:
            logger.error(f"Failed to download file from {url}: {response.status_code}")
            return False

async def extract_text_from_file(file_path, mime_type):
    """Extracted logic from orchestrator to handle media extraction."""
    print(f"💎 Attempting Llama Cloud extraction for {file_path}...")
    llama_res = await llama_cloud_extract(file_path)
    
    full_text = ""
    if llama_res and llama_res.get("raw_text"):
        full_text = llama_res["raw_text"]
    else:
        # Fallback to standard OCR
        print(f"⚠️ Llama Cloud failed, falling back to standard OCR...")
        images = render_pdf_to_images(file_path) if mime_type == "application/pdf" else [file_path]
        for img in images:
            proc = preprocess_image(img)
            ocr_res = ocr_paddle(proc)
            full_text += ocr_res["raw_text"] + "\n"
    
    return full_text

async def sync():
    print("🚀 Starting Retroactive RAG Sync Script...")
    
    conn = await get_db_connection()
    if not conn:
        print("❌ Could not connect to database.")
        return

    try:
        # 1. Identify invoices missing raw_text or embedding
        query = """
            SELECT invoice_id, user_id, vendor_name, file_url 
            FROM invoices 
            WHERE (raw_text IS NULL OR embedding IS NULL)
            AND file_url IS NOT NULL
        """
        rows = await conn.fetch(query)
        print(f"📊 Found {len(rows)} invoices to sync.")
        
        for i, row in enumerate(rows):
            invoice_id = row['invoice_id']
            file_url = row['file_url']
            vendor_name = row['vendor_name'] or "Unknown"
            
            print(f"\n🔄 [{i+1}/{len(rows)}] Syncing: {vendor_name} ({invoice_id})")
            
            # 2. Determine local path or download
            local_path = None
            is_temporary = False
            
            if file_url.startswith("http"):
                # Download to temp
                filename = os.path.basename(file_url.split('?')[0])
                local_path = os.path.join("uploads", "temp_sync", filename)
                print(f"📥 Downloading {file_url}...")
                success = await download_file(file_url, local_path)
                if not success:
                    print(f"❌ Skipping {invoice_id} due to download failure.")
                    continue
                is_temporary = True
            else:
                # Local path
                path_part = file_url.lstrip('/')
                if path_part.startswith("uploads/"):
                    local_path = path_part
                else:
                    local_path = os.path.join("uploads", path_part)
            
            if not os.path.exists(local_path):
                print(f"❌ File not found at {local_path}. Skipping.")
                continue

            # 3. Extract Text and Generate Embedding
            mime_type = "application/pdf" if local_path.lower().endswith(".pdf") else "image/jpeg"
            try:
                raw_text = await extract_text_from_file(local_path, mime_type)
                if not raw_text:
                    print(f"⚠️ No text extracted for {invoice_id}.")
                    continue
                
                print(f"🧠 Generating embedding...")
                embedding_text = f"{vendor_name} {raw_text[:2000]}"
                embedding = await generate_embedding(embedding_text)
                
                # 4. Update Database
                await conn.execute("""
                    UPDATE invoices 
                    SET raw_text = $1, embedding = $2, updated_at = CURRENT_TIMESTAMP
                    WHERE invoice_id = $3
                """, raw_text, str(embedding) if embedding else None, invoice_id)
                
                print(f"✅ Sync complete for {invoice_id}.")
            
            except Exception as e:
                logger.error(f"Failed to process invoice {invoice_id}: {e}")
            
            finally:
                if is_temporary and local_path and os.path.exists(local_path):
                    os.remove(local_path)

    finally:
        await conn.close()
    
    print("\n🎉 Retroactive sync completed!")

if __name__ == "__main__":
    asyncio.run(sync())
