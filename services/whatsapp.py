import httpx
import os
import json
from config import WA_TOKEN, WA_PHONE_ID

async def send_whatsapp_message(to, text):
    if not WA_TOKEN or not WA_PHONE_ID:
        print("❌ WA_TOKEN or WA_PHONE_ID missing in .env")
        return

    url = f"https://graph.facebook.com/v19.0/{WA_PHONE_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": text},
    }
    headers = {
        "Authorization": f"Bearer {WA_TOKEN}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            print(f"📤 WhatsApp API response: {resp.json()}")
        except Exception as err:
            print(f"❌ Error sending WhatsApp message: {err}")

async def send_whatsapp_image(to, image_url, caption=""):
    if not WA_TOKEN or not WA_PHONE_ID:
        return

    url = f"https://graph.facebook.com/v19.0/{WA_PHONE_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "image",
        "image": {"link": image_url, "caption": caption}
    }
    headers = {"Authorization": f"Bearer {WA_TOKEN}"}

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            print(f"📸 Image sent: {image_url}")
        except Exception as err:
            print(f"❌ Error sending image: {err}")

async def upload_media(file_path, mime_type):
    if not WA_TOKEN or not WA_PHONE_ID:
        return None

    url = f"https://graph.facebook.com/v19.0/{WA_PHONE_ID}/media"
    
    async with httpx.AsyncClient() as client:
        try:
            with open(file_path, "rb") as f:
                files = {"file": (os.path.basename(file_path), f, mime_type)}
                data = {"messaging_product": "whatsapp", "type": mime_type}
                headers = {"Authorization": f"Bearer {WA_TOKEN}"}
                
                resp = await client.post(url, data=data, files=files, headers=headers)
                resp.raise_for_status()
                media_id = resp.json().get("id")
                print(f"✅ Media uploaded, ID: {media_id}")
                return media_id
        except Exception as err:
            print(f"❌ Error uploading media: {err}")
            return None

async def send_whatsapp_document(to, media_id, filename, caption=""):
    if not WA_TOKEN or not WA_PHONE_ID:
        return

    url = f"https://graph.facebook.com/v19.0/{WA_PHONE_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "document",
        "document": {
            "id": media_id,
            "filename": filename,
            "caption": caption
        }
    }
    headers = {"Authorization": f"Bearer {WA_TOKEN}"}

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            print(f"📄 Document sent: {filename}")
        except Exception as err:
            print(f"❌ Error sending document: {err}")

async def download_media(media_id, mime_type_hint=""):
    if not WA_TOKEN:
        return None

    async with httpx.AsyncClient() as client:
        try:
            # Step 1: Get media URL
            headers = {"Authorization": f"Bearer {WA_TOKEN}"}
            meta_resp = await client.get(f"https://graph.facebook.com/v19.0/{media_id}", headers=headers)
            meta_resp.raise_for_status()
            
            file_url = meta_resp.json().get("url")
            mime_type = meta_resp.json().get("mime_type", mime_type_hint)

            # Step 2: Download binary data
            file_resp = await client.get(file_url, headers=headers)
            file_resp.raise_for_status()

            ext = "bin"
            if mime_type == "image/jpeg": ext = "jpg"
            elif mime_type == "image/png": ext = "png"
            elif mime_type == "application/pdf": ext = "pdf"
            elif mime_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ext = "xlsx"

            uploads_dir = "uploads"
            if not os.path.exists(uploads_dir):
                os.makedirs(uploads_dir)

            file_path = os.path.join(uploads_dir, f"{media_id}.{ext}")
            with open(file_path, "wb") as f:
                f.write(file_resp.content)
            
            print(f"💾 Saved media to: {file_path}")
            return file_path
        except Exception as err:
            print(f"❌ Error downloading media: {err}")
            return None

async def mark_message_as_read(message_id):
    if not WA_TOKEN or not WA_PHONE_ID:
        return

    url = f"https://graph.facebook.com/v19.0/{WA_PHONE_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "status": "read",
        "message_id": message_id,
    }
    headers = {"Authorization": f"Bearer {WA_TOKEN}"}

    async with httpx.AsyncClient() as client:
        try:
            await client.post(url, json=payload, headers=headers)
            print(f"✅ Message marked as read: {message_id}")
        except Exception as err:
            print(f"❌ Error marking message as read: {err}")
