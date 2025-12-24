import aiosqlite
import os
import json

DB_FILE = "expense_data.db"

async def get_documents_by_user(user_phone, filters=None):
    if filters is None:
        filters = {}
    
    sql = "SELECT * FROM documents WHERE user_phone = ?"
    params = [user_phone]
    
    if filters.get('document_type'):
        sql += " AND document_type = ?"
        params.append(filters['document_type'])
        
    sql += " ORDER BY id DESC"
    
    if filters.get('limit'):
        sql += f" LIMIT {filters['limit']}"

    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(sql, params) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def save_document(user_phone, media_id, filename, file_path, mime_type, doc_type, ocr_result):
    from datetime import datetime
    now = datetime.now().isoformat()
    
    extracted_data = ocr_result.get('extractedData', {})
    category = extracted_data.get('category') if extracted_data else None
    
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("""
            INSERT INTO documents (
                user_phone, media_id, filename, file_path, mime_type, 
                document_type, document_category, extracted_text, extracted_data, 
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_phone, media_id, filename, file_path, mime_type,
            doc_type, category, ocr_result.get('text'),
            json.dumps(extracted_data), now, now
        ))
        await db.commit()
