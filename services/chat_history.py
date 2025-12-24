import aiosqlite
from datetime import datetime

DB_FILE = "expense_data.db"

async def save_chat_message(user_phone, role, content):
    now = datetime.now().isoformat()
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("""
            INSERT INTO chats (user, role, content, timestamp) 
            VALUES (?, ?, ?, ?)
        """, (user_phone, role, content, now))
        await db.commit()

async def get_chat_history(user_phone, limit=20):
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT role, content, timestamp FROM chats 
            WHERE user = ? 
            ORDER BY id DESC LIMIT ?
        """, (user_phone, limit)) as cursor:
            rows = await cursor.fetchall()
            history = [dict(row) for row in rows]
            return history[::-1] # Return in chronological order
