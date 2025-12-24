import asyncio
import sys
import os

# Add root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from storage.db import init_storage, store_expense, verify_clear
from agent_orchestrator.orchestrator import run_agent_loop
from tools.conversation_tools.state import get_pending_action

async def test_clear_gate():
    await init_storage()
    user = "test_user_123"
    
    # 1. Add some data
    await store_expense(user, {"amount": 50, "merchant": "Test"}, "raw text", 0.9, "PASS")
    count = await verify_clear(user)
    print(f"Data count before: {count['remaining_count']}")
    
    # 2. Trigger Clear Request
    print("Triggering CLEAR_EXPENSES_REQUEST...")
    await run_agent_loop(user, text_message="Clear my expenses")
    
    # Check pending action
    pending = await get_pending_action(user)
    print(f"Pending Action: {pending['action_type'] if pending else 'None'}")
    
    # 3. Trigger Confirm
    print("Triggering YES confirmation...")
    await run_agent_loop(user, text_message="YES")
    
    # Verify cleared
    count = await verify_clear(user)
    print(f"Data count after YES: {count['remaining_count']}")
    
    if count['remaining_count'] == 0:
        print("✅ SUCCESS: Clear gate verified.")
    else:
        print("❌ FAILURE: Data was not cleared.")

if __name__ == "__main__":
    asyncio.run(test_clear_gate())
