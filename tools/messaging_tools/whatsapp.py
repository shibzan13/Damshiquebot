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

async def upload_media(file_path, mime_type):
    global WA_TOKEN, WA_PHONE_ID
    if not WA_TOKEN or not WA_PHONE_ID: return None
    
    url = f"https://graph.facebook.com/v17.0/{WA_PHONE_ID}/media"
    headers = {"Authorization": f"Bearer {WA_TOKEN}"}
    
    try:
        # Note: Using synchronous open inside async is generally discouraged but simpler here
        # given we don't have aiofiles. Ideally run in a thread pool.
        with open(file_path, 'rb') as f:
            files = {
                'file': (os.path.basename(file_path), f, mime_type)
            }
            data = {'messaging_product': 'whatsapp'}
            
            async with httpx.AsyncClient() as client:
                print(f"📤 Uploading media: {file_path}")
                response = await client.post(url, headers=headers, files=files, data=data, timeout=30.0)
                
                if response.status_code == 200:
                    return response.json().get("id")
                else:
                    print(f"❌ Upload Error: {response.text}")
                    return None
    except Exception as e:
        print(f"❌ Upload Exception: {e}")
        return None

async def send_whatsapp_document(user_phone, media_id, filename, caption=None):
    global WA_TOKEN, WA_PHONE_ID
    if not WA_TOKEN or not WA_PHONE_ID: return False
    
    url = f"https://graph.facebook.com/v17.0/{WA_PHONE_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WA_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": user_phone,
        "type": "document",
        "document": {
            "id": media_id,
            "filename": filename
        }
    }
    
    if caption:
        payload["document"]["caption"] = caption
        
    async with httpx.AsyncClient() as client:
        try:
            print(f"📤 Sending Document to {user_phone}: {filename}")
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            if response.status_code == 200:
                return True
            else:
                print(f"❌ WA Document Error: {response.text}")
                return False
        except Exception as e:
            print(f"❌ WA Document Exception: {e}")
            return False
