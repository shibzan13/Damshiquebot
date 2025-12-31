import asyncio
import os
import sys

# Add root to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from storage.postgres_repository import get_db_connection

async def run_migrations():
    conn = await get_db_connection()
    if not conn:
        print("❌ Failed to connect to PostgreSQL")
        return
    
    migration_path = os.path.join(os.getcwd(), "storage", "migrations", "01_invoice_tables.sql")
    if not os.path.exists(migration_path):
        # Try relative to script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        migration_path = os.path.join(script_dir, "..", "storage", "migrations", "01_invoice_tables.sql")
        
    if not os.path.exists(migration_path):
        print(f"❌ Migration file not found: {migration_path}")
        return

    print(f"🚀 Running migration: {migration_path}...")
    
    with open(migration_path, "r") as f:
        sql = f.read()

    try:
        await conn.execute(sql)
        print("✅ Migration applied successfully!")
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run_migrations())
