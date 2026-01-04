import asyncio
from storage.postgres_repository import run_pg_migrations
from dotenv import load_dotenv

async def run():
    load_dotenv()
    await run_pg_migrations()

if __name__ == "__main__":
    asyncio.run(run())
