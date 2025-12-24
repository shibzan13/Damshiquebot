import aiosqlite
import json
from services.db import get_expenses_for_user

DB_FILE = "expense_data.db"

async def search_expenses(query, user_phone):
    """Search for specific expenses in the database."""
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        q = f"%{query}%"
        async with db.execute("""
            SELECT * FROM expenses 
            WHERE user_phone = ? AND (merchant LIKE ? OR category LIKE ?)
            ORDER BY date DESC LIMIT 10
        """, (user_phone, q, q)) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def search_documents(query, user_phone):
    """Search for text within uploaded documents (RAG)."""
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        q = f"%{query}%"
        async with db.execute("""
            SELECT filename, extracted_text, created_at FROM documents 
            WHERE user_phone = ? AND extracted_text LIKE ?
            ORDER BY created_at DESC LIMIT 5
        """, (user_phone, q)) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def get_spend_summary(user_phone):
    """Calculate totals by category and currency."""
    expenses = await get_expenses_for_user(user_phone)
    summary = {}
    for e in expenses:
        cur = e.get('currency', 'GBP')
        cat = e.get('category', 'Other')
        amt = float(e.get('amount', 0))
        if cur not in summary: summary[cur] = {"total": 0, "categories": {}}
        summary[cur]["total"] += amt
        summary[cur]["categories"][cat] = summary[cur]["categories"].get(cat, 0) + amt
    return summary

# Map names to functions for the Agent
TOOLS = {
    "search_expenses": search_expenses,
    "search_documents": search_documents,
    "get_spend_summary": get_spend_summary
}
