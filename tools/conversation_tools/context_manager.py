import logging
import json
from typing import Dict, Any, Optional, List
from storage.postgres_repository import get_db_connection
from datetime import datetime

logger = logging.getLogger(__name__)

async def log_conversation_message(user_id: str, role: str, content: str):
    """
    Log a message to the conversation history.
    role: 'user' or 'bot'
    """
    conn = await get_db_connection()
    if not conn: return
    try:
        await conn.execute(
            "INSERT INTO conversation_history (user_id, role, content) VALUES ($1, $2, $3)",
            user_id, role, content
        )
    except Exception as e:
        logger.error(f"Failed to log message: {e}")
    finally:
        await conn.close()

async def get_recent_messages(user_id: str, limit: int = 5) -> List[Dict[str, str]]:
    """
    Get the last N messages for this user.
    """
    conn = await get_db_connection()
    if not conn: return []
    try:
        rows = await conn.fetch("""
            SELECT role, content 
            FROM conversation_history 
            WHERE user_id = $1 
            ORDER BY timestamp DESC 
            LIMIT $2
        """, user_id, limit)
        return [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]
    except Exception as e:
        logger.error(f"Failed to fetch history: {e}")
        return []
    finally:
        await conn.close()

async def get_conversation_context(user_id: str) -> Dict[str, Any]:
    conn = await get_db_connection()
    if not conn:
        return {}
    
    try:
        row = await conn.fetchrow("SELECT last_invoice_id, last_query_type, payload FROM conversation_context WHERE user_id = $1", user_id)
        
        ctx = {}
        if row:
            ctx = {
                "last_invoice_id": str(row['last_invoice_id']) if row['last_invoice_id'] else None,
                "last_query_type": row['last_query_type'],
                "payload": json.loads(row['payload']) if row['payload'] else {}
            }
            
        # Add recent history
        history = await get_recent_messages(user_id, limit=5)
        ctx["history"] = history
        
        return ctx
    except Exception as e:
        logger.error(f"Failed to fetch conversation context: {e}")
        return {}
    finally:
        await conn.close()

async def update_conversation_context(user_id: str, last_invoice_id: Optional[str] = None, last_query_type: Optional[str] = None, payload: Optional[Dict[str, Any]] = None):
    conn = await get_db_connection()
    if not conn:
        return
    
    try:
        # Resolve existing context
        existing = await get_conversation_context(user_id)
        
        new_invoice_id = last_invoice_id or existing.get("last_invoice_id")
        new_query_type = last_query_type or existing.get("last_query_type")
        new_payload = {**(existing.get("payload") or {}), **(payload or {})}

        await conn.execute("""
            INSERT INTO conversation_context (user_id, last_invoice_id, last_query_type, payload, updated_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO UPDATE SET
                last_invoice_id = EXCLUDED.last_invoice_id,
                last_query_type = EXCLUDED.last_query_type,
                payload = EXCLUDED.payload,
                updated_at = CURRENT_TIMESTAMP
        """, user_id, new_invoice_id, new_query_type, json.dumps(new_payload))
    except Exception as e:
        logger.error(f"Failed to update conversation context: {e}")
    finally:
        await conn.close()
