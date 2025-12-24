import aiosqlite
import json
from datetime import datetime, timedelta

DB_FILE = "expense_data.db"

async def set_pending_action(user_phone, action_type, payload, ttl_minutes=10):
    expires_at = (datetime.now() + timedelta(minutes=ttl_minutes)).isoformat()
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("""
            INSERT OR REPLACE INTO pending_actions (user_phone, action_type, payload, expires_at)
            VALUES (?, ?, ?, ?)
        """, (user_phone, action_type, json.dumps(payload), expires_at))
        await db.commit()
    return True

async def get_pending_action(user_phone):
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM pending_actions WHERE user_phone = ?", 
            (user_phone,)
        ) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            
            # Check expiration
            expires_at = datetime.fromisoformat(row['expires_at'])
            if datetime.now() > expires_at:
                await clear_pending_action(user_phone)
                return None
                
            return {
                "action_type": row['action_type'],
                "payload": json.loads(row['payload'])
            }

async def clear_pending_action(user_phone):
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("DELETE FROM pending_actions WHERE user_phone = ?", (user_phone,))
        await db.commit()
    return True
