import aiosqlite
import asyncio
from datetime import datetime
import os
import json

DB_FILE = "expense_data.db"

async def init_storage():
    async with aiosqlite.connect(DB_FILE) as db:
        # Create expenses table if it doesn't exist
        await db.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_phone TEXT NOT NULL,
                date TEXT,
                merchant TEXT,
                amount REAL,
                currency TEXT,
                category TEXT,
                raw_text TEXT,
                confidence REAL,
                status TEXT, -- PASS, NEEDS_REVIEW, FAIL, DELETED
                created_at TEXT NOT NULL
            )
        """)
        
        # Check if raw_text column exists
        cursor = await db.execute("""
            SELECT name FROM pragma_table_info('expenses') 
            WHERE name = 'raw_text'
        """)
        
        # Fetch the result
        result = await cursor.fetchone()
        
        # Add raw_text column if it doesn't exist
        if not result:
            await db.execute("""
                ALTER TABLE expenses ADD COLUMN raw_text TEXT
            """)
            print("✅ Added missing 'raw_text' column to expenses table")
            
        # Pending Actions (Conversation State)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS pending_actions (
                user_phone TEXT PRIMARY KEY,
                action_type TEXT NOT NULL,
                payload TEXT,
                expires_at DATETIME NOT NULL
            )
        """)
        
        await db.commit()

async def store_expense(user_phone, expense_json, raw_text, confidence, status):
    now = datetime.now().isoformat()
    async with aiosqlite.connect(DB_FILE) as db:
        cursor = await db.execute("""
            INSERT INTO expenses (
                user_phone, date, merchant, amount, currency, category, 
                raw_text, confidence, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_phone,
            expense_json.get('date'),
            expense_json.get('merchant'),
            float(expense_json.get('amount')) if expense_json.get('amount') else 0.0,
            expense_json.get('currency', 'AED'),
            expense_json.get('category', 'Other'),
            raw_text,
            confidence,
            status,
            now
        ))
        await db.commit()
        return cursor.lastrowid

async def list_expenses(user_phone, date_range=None):
    # date_range: (start_date, end_date)
    query = "SELECT * FROM expenses WHERE user_phone = ? AND status != 'DELETED'"
    params = [user_phone]
    
    if date_range:
        query += " AND date >= ? AND date <= ?"
        params.extend(date_range)
    
    query += " ORDER BY date DESC, created_at DESC"
    
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def totals_expenses(user_phone, date_range=None):
    query = "SELECT currency, SUM(amount) as total, COUNT(*) as count FROM expenses WHERE user_phone = ? AND status != 'DELETED'"
    params = [user_phone]
    
    if date_range:
        query += " AND date >= ? AND date <= ?"
        params.extend(date_range)
    
    query += " GROUP BY currency"
    
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            
            # Also get per-category breakdown
            cat_query = "SELECT category, SUM(amount) as total FROM expenses WHERE user_phone = ? AND status != 'DELETED'"
            cat_params = [user_phone]
            if date_range:
                cat_query += " AND date >= ? AND date <= ?"
                cat_params.extend(date_range)
            cat_query += " GROUP BY category"
            
            async with db.execute(cat_query, cat_params) as cat_cursor:
                cat_rows = await cat_cursor.fetchall()
                
            return {
                "totals": [dict(r) for r in rows],
                "by_category": [dict(r) for r in cat_rows]
            }

async def clear_expenses(user_phone):
    async with aiosqlite.connect(DB_FILE) as db:
        cursor = await db.execute(
            "UPDATE expenses SET status = 'DELETED' WHERE user_phone = ? AND status != 'DELETED'",
            (user_phone,)
        )
        await db.commit()
        return {"deleted_count": cursor.rowcount}

async def verify_clear(user_phone):
    async with aiosqlite.connect(DB_FILE) as db:
        async with db.execute(
            "SELECT COUNT(*) FROM expenses WHERE user_phone = ? AND status != 'DELETED'",
            (user_phone,)
        ) as cursor:
            row = await cursor.fetchone()
            return {"remaining_count": row[0]}
