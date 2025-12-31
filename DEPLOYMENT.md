# Damshique Intelligence - Deployment Guide

This guide covers how to deploy the full Damshique Intelligence System (Backend + Database + Frontend) using Docker Compose. This ensures a production-ready environment on any VPS (AWS EC2, DigitalOcean, Azure, etc.) or local machine.

## Prerequisites

1.  **Docker** and **Docker Compose** installed.
2.  **Git** installed.
3.  Access to user credentials (API Keys).

---

## 🚀 Quick Start (Docker Compose)

The easiest way to run the entire system is with the provided `docker-compose.yml`.

### 1. Clone & Configure

Navigate to the project directory and ensure your `.env` file is ready.

```bash
# Create/Edit .env file
nano .env
```

Paste your secrets into `.env`. **Important**: Ensure `DATABASE_URL` is NOT set in `.env` if using Docker Compose, or set it to point to the docker container alias `db`. The `docker-compose.yml` automatically sets a default `DATABASE_URL` connecting to the internal postgres service, but you can override it if you like.

**Recommended .env variables to set:**
```ini
GEMINI_API_KEY=your_key
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_key
AWS_S3_BUCKET=damshique-mark1-bot
WA_TOKEN=your_whatsapp_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
ADMIN_TOKEN=your_secure_admin_token
```

### 2. Build and Run

Run the following command to build the containers (Frontend + Backend) and start the database.

```bash
docker-compose up --build -d
```

- `--build`: Forces a rebuild of the images (compiles React app).
- `-d`: Runs in detached mode (background).

### 3. Verify Deployment

- **Web Dashboard**: Open `http://<YOUR_SERVER_IP>:3000`
- **API Docs**: Open `http://<YOUR_SERVER_IP>:3000/docs`

---

## 🛠 Manual Deployment (Without Docker)

If you prefer running services manually:

### 1. Database
Install PostgreSQL 15+ and create a database named `expense_tracker`.
Update `.env` with `DATABASE_URL=postgresql://user:pass@localhost:5432/expense_tracker`.

### 2. Frontend
Navigate to the UI folder and build:
```bash
cd webapp/damshique-bot-ui
npm install
npm run build
```
This creates a `dist` folder. The Python backend is configured to serve this folder automatically.

### 3. Backend
Install dependencies and run:
```bash
cd ../../  # Back to root
pip install -r requirements.txt
python main.py
```

---

## ☁ Cloud Deployment (Railway/Render)

1.  **Repo**: Connect this GitHub repo.
2.  **Build Command**: `pip install -r requirements.txt` (The frontend build must be handled via a custom build script or pre-built, or use the Dockerfile deployment method which is supported by Railway/Render).
3.  **Start Command**: `python main.py`
4.  **Environment**: Add all variables from `.env`.
5.  **Database**: Provision a PostgreSQL service and link it via `DATABASE_URL`.

**Recommendation**: Use the `Dockerfile` method on Railway/Render for the easiest setup as it handles the multi-stage frontend build automatically.
