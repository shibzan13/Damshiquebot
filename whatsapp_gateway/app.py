from fastapi import FastAPI, Request, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import json
import httpx
from typing import List
from agent_orchestrator.orchestrator import run_agent_loop
from api.admin_api import router as admin_router
from api.analytics_api import router as analytics_router
from api.auth_api import router as auth_router
from tools.messaging_tools.whatsapp import send_whatsapp
from tools.notification_engine import NotificationEngine
from storage.postgres_repository import run_pg_migrations

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

app = FastAPI()
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(analytics_router)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"📡 Incoming: {request.method} {request.url.path}")
    response = await call_next(request)
    print(f"🚦 Outgoing: {request.method} {request.url.path} -> {response.status_code}")
    return response

WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "agentic_token")
WA_TOKEN = os.getenv("WA_TOKEN")

@app.on_event("startup")
async def startup():
    await run_pg_migrations()
    NotificationEngine.set_broadcaster(manager.broadcast)
    print("🚀 Agentic Expense System Ready")

@app.get("/health")
async def health_check():
    from storage.postgres_repository import check_db_health
    is_healthy, detail = await check_db_health()
    return {
        "status": "healthy" if is_healthy else "degraded",
        "database": detail,
        "environment": os.getenv("ENV", "production")
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/webhook")
async def verify_webhook(request: Request):
    from fastapi.responses import Response
    params = request.query_params
    hub_mode = params.get("hub.mode")
    hub_verify_token = params.get("hub.verify_token")
    hub_challenge = params.get("hub.challenge")
    
    # Clean tokens (remove quotes or spaces if they exist)
    clean_received = str(hub_verify_token).strip().replace('"', '').replace("'", "")
    clean_expected = str(WHATSAPP_VERIFY_TOKEN).strip().replace('"', '').replace("'", "")

    if hub_mode == "subscribe" and clean_received == clean_expected:
        print("✅ Webhook Verified Successfully!")
        return Response(content=str(hub_challenge), media_type="text/plain")
    
    print(f"❌ Webhook Verification Failed! Received: '{clean_received}', Expected: '{clean_expected}'")
    return Response(content="Verification Failed", status_code=403)

@app.post("/webhook")
async def webhook_handler(request: Request, background_tasks: BackgroundTasks):
    print(f"--- WEBHOOK HIT: {request.method} {request.url.path} ---")
    try:
        raw_body = await request.body()
        print(f"📦 RAW BODY: {raw_body.decode('utf-8')}")
        data = json.loads(raw_body)
        
        if data.get("object") != "whatsapp_business_account":
            return {"status": "ok"}

        for entry in data.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                if "messages" in value:
                    for msg in value["messages"]:
                        user_phone = msg.get("from")
                        msg_id = msg.get("id", "TEST_ID")
                        text_body = msg.get("text", {}).get("body", "") if "text" in msg else None
                        print(f"📩 Processing message [{msg_id}] from {user_phone}: '{text_body}'")
                        
                        # Handle Media
                        media_path = None
                        mime_type = None
                        
                        if "image" in msg:
                            print(f"📸 Image detected in message {msg_id}")
                            image_id = msg["image"]["id"]
                            mime_type = msg["image"].get("mime_type", "image/jpeg")
                            # Immediate feedback
                            background_tasks.add_task(send_whatsapp, user_phone, "📸 I've received your receipt. Processing it now... ⏳")
                            media_path = await download_wa_media(image_id, mime_type)
                        elif "document" in msg:
                            print(f"📄 Document detected in message {msg_id}")
                            doc_id = msg["document"]["id"]
                            mime_type = msg["document"].get("mime_type", "application/pdf")
                            # Immediate feedback
                            background_tasks.add_task(send_whatsapp, user_phone, "📄 I've received your document. Reading the details... ⏳")
                            media_path = await download_wa_media(doc_id, mime_type)
                        elif "audio" in msg:
                            print(f"🔊 Audio detected (not supported yet) in {msg_id}")

                        text_body = msg.get("text", {}).get("body", "") if "text" in msg else None
                        
                        # For images/docs with captions
                        if not text_body:
                            if "image" in msg: text_body = msg["image"].get("caption")
                            elif "document" in msg: text_body = msg["document"].get("caption")

                        document_id = None
                        if "image" in msg: document_id = msg["image"]["id"]
                        elif "document" in msg: document_id = msg["document"]["id"]

                        print(f"🏃 Handing off to Agent: user={user_phone}, text='{text_body}', media={bool(media_path)}")
                        background_tasks.add_task(run_agent_loop, user_phone, text_body, media_path, mime_type, document_id)
        
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
        local_path = os.path.join("uploads", f"{media_id}.{ext}")
        with open(local_path, "wb") as f:
            f.write(res.content)
        return local_path

# Serve Uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Serve Frontend Static Files
# In Docker, the app is in /app. We use absolute paths to avoid CWD issues.
BASE_DIR = "/app" if os.path.exists("/app/WebApp") else os.getcwd()
build_dir = os.path.join(BASE_DIR, "WebApp", "damshique-bot-ui", "dist")
actual_build_dir = build_dir

@app.on_event("startup")
async def verify_static_dir():
    global actual_build_dir
    print(f"📂 Current Working Directory: {os.getcwd()}")
    print(f"📂 Looking for static files in: {build_dir}")
    if os.path.exists(build_dir):
        print(f"✅ Static directory found! Contents: {os.listdir(build_dir)}")
        actual_build_dir = build_dir
    else:
        # Try a fallback if we are running inside the whatsapp_gateway directory
        fallback_dir = os.path.abspath(os.path.join(os.getcwd(), "..", "WebApp", "damshique-bot-ui", "dist"))
        if os.path.exists(fallback_dir):
            print(f"✅ Found static files in fallback: {fallback_dir}")
            actual_build_dir = fallback_dir
        else:
            print(f"❌ Static directory NOT FOUND. CWD contents: {os.listdir(os.getcwd())}")

# SPA 404 Handler: Redirect unknown web routes to index.html
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.responses import FileResponse

@app.exception_handler(404)
async def spa_exception_handler(request, exc):
    path = request.url.path
    # Serve index.html for non-API routes that aren't file requests
    if not path.startswith("/api/") and "." not in path.split("/")[-1]:
        index_path = os.path.join(actual_build_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
    
    # Otherwise return normal 404
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=404, content={"detail": "Not Found"})

# Mount static files at the root
if os.path.exists(build_dir):
    app.mount("/", StaticFiles(directory=build_dir, html=True), name="static")
elif os.path.exists(os.path.abspath(os.path.join(os.getcwd(), "..", "WebApp", "damshique-bot-ui", "dist"))):
     fallback = os.path.abspath(os.path.join(os.getcwd(), "..", "WebApp", "damshique-bot-ui", "dist"))
     app.mount("/", StaticFiles(directory=fallback, html=True), name="static")
