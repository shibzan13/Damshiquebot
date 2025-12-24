from fastapi import FastAPI, Request, BackgroundTasks
import os
import json
import httpx
from agent_orchestrator.orchestrator import run_agent_loop
from storage.db import init_storage
from tools.messaging_tools.whatsapp import send_whatsapp

app = FastAPI()

WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "agentic_token")
WA_TOKEN = os.getenv("WA_TOKEN")

@app.on_event("startup")
async def startup():
    await init_storage()
    print("🚀 Agentic Expense System Ready")

@app.get("/webhook")
async def verify_webhook(request: Request):
    params = request.query_params
    if params.get("hub.mode") == "subscribe" and params.get("hub.verify_token") == WHATSAPP_VERIFY_TOKEN:
        return int(params.get("hub.challenge"))
    return "Error"

@app.post("/webhook")
async def webhook_handler(request: Request, background_tasks: BackgroundTasks):
    try:
        data = await request.json()
        print(f"📩 Webhook received: {json.dumps(data, indent=2)}")
        
        if data.get("object") != "whatsapp_business_account":
            return {"status": "ok"}

        for entry in data.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                if "messages" in value:
                    for msg in value["messages"]:
                        user_phone = msg.get("from")
                        
                        # 2. Handle Message
                        media_path = None
                        mime_type = None
                        
                        if "image" in msg:
                            image_id = msg["image"]["id"]
                            mime_type = msg["image"].get("mime_type", "image/jpeg")
                            media_path = await download_wa_media(image_id, mime_type)
                        elif "document" in msg:
                            doc_id = msg["document"]["id"]
                            mime_type = msg["document"].get("mime_type", "application/pdf")
                            media_path = await download_wa_media(doc_id, mime_type)

                        text_body = msg.get("text", {}).get("body", "") if "text" in msg else None
                        
                        # Use orchestrator
                        background_tasks.add_task(run_agent_loop, user_phone, text_body, media_path, mime_type)
        
        return {"status": "ok"}
    except Exception as e:
        print(f"❌ Webhook Handler Error: {e}")
        return {"status": "error", "message": str(e)}

async def download_wa_media(media_id, mime_type):
    if not WA_TOKEN: return None
    url = f"https://graph.facebook.com/v17.0/{media_id}"
    headers = {"Authorization": f"Bearer {WA_TOKEN}"}
    
    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=headers)
        if res.status_code != 200: return None
        media_url = res.json().get("url")
        
        # Download actual file
        res = await client.get(media_url, headers=headers)
        if res.status_code != 200: return None
        
        # Determine extension
        ext = "bin"
        if "pdf" in mime_type: ext = "pdf"
        elif "png" in mime_type: ext = "png"
        elif "jpeg" in mime_type or "jpg" in mime_type: ext = "jpg"
        
        os.makedirs("uploads", exist_ok=True)
        file_path = os.path.join("uploads", f"{media_id}.{ext}")
        with open(file_path, "wb") as f:
            f.write(res.content)
        return file_path
