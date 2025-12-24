import aiosqlite
import asyncio
from datetime import datetime
import json

DB_FILE = "expense_data.db"

async def init_db():
    async with aiosqlite.connect(DB_FILE) as db:
        # Expenses Table (with soft-delete support)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_phone TEXT NOT NULL,
                user TEXT,
                date TEXT,
                merchant TEXT,
                amount REAL NOT NULL,
                currency TEXT,
                category TEXT,
                payment_method TEXT,
                vat TEXT,
                source TEXT,
                file_path TEXT,
                status TEXT DEFAULT 'ACTIVE',
                created_at TEXT NOT NULL
            )
        """)

        # Processed Messages
        await db.execute("""
            CREATE TABLE IF NOT EXISTS processed_messages (
                message_id TEXT PRIMARY KEY,
                processed_at TEXT NOT NULL
            )
        """)

        # User Settings
        await db.execute("""
            CREATE TABLE IF NOT EXISTS user_settings (
                user_phone TEXT PRIMARY KEY,
                default_currency TEXT,
                default_time_range TEXT,
                weekly_summary INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        # Budgets
        await db.execute("""
            CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_phone TEXT NOT NULL,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT NOT NULL,
                period TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)

        # Chat History
        await db.execute("""
            CREATE TABLE IF NOT EXISTS chats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT,
                timestamp TEXT
            )
        """)

        # Documents
        await db.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_phone TEXT NOT NULL,
                media_id TEXT,
                filename TEXT,
                file_path TEXT,
                mime_type TEXT,
                document_type TEXT NOT NULL,
                document_category TEXT,
                extracted_text TEXT,
                extracted_data TEXT,
                metadata TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        await db.commit()
    print(f"✅ Database synchronized: {DB_FILE}")

async def insert_expenses(user_phone, expenses_list, source, file_path=""):
    if not expenses_list:
        return
    
    now = datetime.now().isoformat()
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("BEGIN TRANSACTION")
        try:
            for e in expenses_list:
                await db.execute("""
                    INSERT INTO expenses (
                        user_phone, user, date, merchant, amount, currency, category, 
                        payment_method, vat, source, file_path, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    user_phone,
                    user_phone,
                    e.get('date', now[:10]),
                    e.get('merchant', 'Unknown'),
                    float(e.get('amount', 0)),
                    e.get('currency', 'GBP'),
                    e.get('category', 'Uncategorised'),
                    e.get('payment_method', ''),
                    e.get('vat', ''),
                    source,
                    file_path,
                    now
                ))
            await db.commit()
            print(f"✅ Inserted {len(expenses_list)} expenses for {user_phone}")
        except Exception as err:
            await db.rollback()
            print(f"❌ Transaction failed, rolled back: {err}")
            raise err

async def get_expenses_for_user(user_phone, filters=None):
    if filters is None:
        filters = {}
    
    sql = "SELECT * FROM expenses WHERE user_phone = ? AND (status IS NULL OR status != 'DELETED')"
    params = [user_phone]

    if filters.get('fromDate'):
        sql += " AND COALESCE(NULLIF(date, ''), SUBSTR(created_at, 1, 10)) >= ?"
        params.append(filters['fromDate'])
    if filters.get('toDate'):
        sql += " AND COALESCE(NULLIF(date, ''), SUBSTR(created_at, 1, 10)) <= ?"
        params.append(filters['toDate'])

    sql += " ORDER BY COALESCE(NULLIF(date, ''), created_at) DESC"

    if filters.get('limit'):
        sql += " LIMIT ?"
        params.append(filters['limit'])

    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(sql, params) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def get_totals_by_currency(user_phone):
    sql = "SELECT currency, SUM(amount) as total FROM expenses WHERE user_phone = ? GROUP BY currency"
    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute(sql, [user_phone]) as cursor:
            rows = await cursor.fetchall()
            return {row[0]: row[1] for row in rows}

async def has_processed_message(message_id):
    sql = "SELECT message_id FROM processed_messages WHERE message_id = ?"
    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute(sql, [message_id]) as cursor:
            row = await cursor.fetchone()
            return row is not None

async def mark_message_processed(message_id):
    now = datetime.now().isoformat()
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("INSERT INTO processed_messages (message_id, processed_at) VALUES (?, ?)", (message_id, now))
        await db.commit()

async def set_budget(user_phone, amount, currency='GBP', category='Monthly'):
    now = datetime.now().isoformat()
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("""
            INSERT INTO user_settings (user_phone, default_currency, created_at, updated_at) 
            VALUES (?, ?, ?, ?) ON CONFLICT(user_phone) DO UPDATE SET default_currency = ?, updated_at = ?
        """, (user_phone, currency, now, now, currency, now))
        
        await db.execute("""
            INSERT INTO budgets (user_phone, category, amount, currency, period, created_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_phone, category, amount, currency, 'monthly', now))
        await db.commit()

async def clear_user_expenses(user_phone):
    """
    Clear all expenses for a user (soft delete)
    Returns the number of rows affected
    """
    print(f"🧹 Clearing expenses for {user_phone}...")
    async with aiosqlite.connect(DB_FILE) as db:
        cursor = await db.execute(
            "UPDATE expenses SET status = 'DELETED' WHERE user_phone = ? AND (status IS NULL OR status != 'DELETED')",
            (user_phone,)
        )
        await db.commit()
        rows_affected = cursor.rowcount
        print(f"✅ Cleared {rows_affected} expenses")
        return rows_affected

async def get_budget(user_phone):
    sql = "SELECT * FROM budgets WHERE user_phone = ? ORDER BY id DESC LIMIT 1"
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(sql, [user_phone]) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None
