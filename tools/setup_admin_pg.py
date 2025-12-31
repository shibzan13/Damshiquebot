import asyncio
import os
import sys

# Add root to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from storage.postgres_repository import get_db_connection

async def setup_admin(phone, name):
    conn = await get_db_connection()
    if not conn:
        print("❌ Failed to connect to database")
        return
    
    try:
        await conn.execute("""
            INSERT INTO system_users (phone, name, role, is_approved)
            VALUES ($1, $2, 'admin', TRUE)
            ON CONFLICT (phone) DO UPDATE SET role = 'admin', is_approved = TRUE
        """, phone, name)
        print(f"✅ User {name} ({phone}) is now an ADMIN in Postgres.")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    phone = "447553609880"
    name = "Shibzan"
    asyncio.run(setup_admin(phone, name))
