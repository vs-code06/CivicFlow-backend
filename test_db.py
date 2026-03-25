import asyncio
import os
from chatbot import ChatbotManager
from dotenv import load_dotenv

load_dotenv()

async def test():
    mgr = ChatbotManager()
    await mgr.connect()
    
    print("Testing Admin Role...")
    admin_ctx = await mgr.get_db_context("admin", "test_id")
    print("Admin Context:", admin_ctx)

    try:
        tasks = await mgr.db.list_collection_names()
        print("Collections in DB:", tasks)
    except Exception as e:
        print("Error:", e)

    await mgr.close()

if __name__ == "__main__":
    asyncio.run(test())
