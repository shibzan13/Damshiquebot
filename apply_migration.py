import asyncio
from storage.postgres_repository import get_db_connection

async def run_migration():
    conn = await get_db_connection()
    if not conn:
        print("Failed to connect")
        return

    try:
        with open("storage/migrations/02_chat_history.sql", "r") as f:
            sql = f.read()
            await conn.execute(sql)
            print("Migration applied successfully.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run_migration())
