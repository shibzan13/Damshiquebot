import httpx
import os

WA_TOKEN = os.getenv("WA_TOKEN")
WA_PHONE_ID = os.getenv("WA_PHONE_ID")

async def send_whatsapp(user_phone, text):
    global WA_TOKEN, WA_PHONE_ID
    if not WA_TOKEN: WA_TOKEN = os.getenv("WA_TOKEN")
    if not WA_PHONE_ID: WA_PHONE_ID = os.getenv("WA_PHONE_ID")

    if not WA_TOKEN or not WA_PHONE_ID:
        print(f"⚠️ WhatsApp not configured. Simulation: To {user_phone}: {text}")
        return False
        
    url = f"https://graph.facebook.com/v17.0/{WA_PHONE_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WA_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": user_phone,
        "type": "text",
        "text": {"body": text}
    }
    
    async with httpx.AsyncClient() as client:
        try:
            print(f"📤 Sending WhatsApp to {user_phone}: {text}")
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            if response.status_code == 200:
                return True
            else:
                print(f"❌ WA Error: {response.text}")
                return False
        except Exception as e:
            print(f"❌ WA Exception: {e}")
            return False

async def mark_read(message_id):
    if not WA_TOKEN or not WA_PHONE_ID: return
    url = f"https://graph.facebook.com/v17.0/{WA_PHONE_ID}/messages"
    headers = {"Authorization": f"Bearer {WA_TOKEN}"}
    payload = {
        "messaging_product": "whatsapp",
        "status": "read",
        "message_id": message_id
    }
    async with httpx.AsyncClient() as client:
        await client.post(url, headers=headers, json=payload)
