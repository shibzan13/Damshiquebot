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
app.include_router(admin_router)
app.include_router(analytics_router)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
                        document_id = None
                        if "image" in msg: document_id = msg["image"]["id"]
                        elif "document" in msg: document_id = msg["document"]["id"]

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
