# 📕 WhatsApp Invoice Intelligence Bot - Project Documentation

This document provides a comprehensive overview of the **Agentic Invoice Intelligence System**. It covers the multi-tier architecture, AI bot logic, and storage strategies.

---

## 🏗️ High-Level Architecture

This system is an **Agentic Invoice Ingestion & Analytics Bot**. It processes raw invoices (images/PDFs) sent via WhatsApp, extracts granular line-item data, and provides an AI-powered conversational interface and a web dashboard for financial intelligence.

### Core Principles
1.  **Database as Truth**: All data is stored in **PostgreSQL**.
2.  **Deterministic Logic**: Finance math and DB queries are deterministic (no AI hallucinations for numbers).
3.  **Agentic AI**: LLMs are used for high-level reasoning (intent, extraction, summarization).
4.  **Security**: Native permission gating for Approved Employees vs. Admins.

---

## 📂 Project Directory Map

### 1. 🧠 Core Orchestration
-   [`agent_orchestrator/orchestrator.py`](./agent_orchestrator/orchestrator.py): The **Central Nervous System**. Manages the loop for incoming messages, coordinating between extraction, classification, and response.

### 2. 💬 AI & Conversation Tools
-   [`tools/conversation_tools/intent_classifier.py`](./tools/conversation_tools/intent_classifier.py): Uses **Gemini 2.0 Flash** to translate natural language into structured query intents.
-   [`tools/conversation_tools/context_manager.py`](./tools/conversation_tools/context_manager.py): Session memory system. Tracks "which invoice" the user is talking about.
-   [`tools/conversation_tools/response_generator.py`](./tools/conversation_tools/response_generator.py): Formats complex database results into professional, human-readable WhatsApp messages.

### 3. 📄 Document extraction Engine
-   [`tools/document_tools/extraction_tools.py`](./tools/document_tools/extraction_tools.py): The AI extraction layer. Normalizes receipts/invoices into structured JSON.
-   [`tools/document_tools/llama_cloud_parser.py`](./tools/document_tools/llama_cloud_parser.py): High-fidelity cloud extraction for complex PDFs/Images.
-   [`tools/document_tools/ocr_tools.py`](./tools/document_tools/ocr_tools.py): Local fallback OCR (PaddleOCR) for robust operation when cloud APIs are unavailable.

### 4. 🗄️ Storage & Backend
-   [`storage/postgres_repository.py`](./storage/postgres_repository.py): Primary data layer. Handles Invoices, Line Items, Users, and Audit Logs.
-   [`storage/analytics.py`](./storage/analytics.py): Dedicated engine for calculating spend patterns, top merchants, and department drills.
-   [`storage/migrations/`](./storage/migrations/): SQL definitions for the database schema.

### 5. 🌐 Web Dashboard (Admin Portal)
-   [`webapp/damshique-bot-ui/`](./webapp/damshique-bot-ui/): A modern React/Vite dashboard for Admins.
    -   [`InvoicesDashboard.tsx`](./webapp/damshique-bot-ui/src/components/invoices-dashboard.tsx): Live feed of all system ingestions.
    -   [`AdminChat.tsx`](./webapp/damshique-bot-ui/src/components/admin-chat.tsx): A "ChatGPT-like" interface for company-wide financial queries.
    -   [`SettingsDashboard.tsx`](./webapp/damshique-bot-ui/src/components/settings-dashboard.tsx): System control center (API keys, Webhooks, Storage config).

### 6. 🛠️ Utilities & Integration
-   [`whatsapp_gateway/app.py`](./whatsapp_gateway/app.py): The FastAPI entry point. Handles WhatsApp webhooks and serves the API for the dashboard.
-   [`tools/export_tools.py`](./tools/export_tools.py): Dynamic report generator (Excel/CSV) for all system modules.
-   [`tools/notification_engine.py`](./tools/notification_engine.py): Event-driven alert system (Real-time WhatsApp notifications for high-value invoices).
-   [`tools/messaging_tools/whatsapp.py`](./tools/messaging_tools/whatsapp.py): Wrapper for Meta's WhatsApp Cloud API.

---

## 🔄 Lifecycle of an Invoice

1.  **Ingestion**: User sends a receipt image to the WhatsApp number.
2.  **Preprocessing**: [`ocr_tools.py`](./tools/document_tools/ocr_tools.py) cleans the image and extracts raw text.
3.  **Intelligence**: [`extraction_tools.py`](./tools/document_tools/extraction_tools.py) uses Gemini to turn text into a structured financial document.
4.  **Validation**: [`validation_engine.py`](./tools/finance_tools/validation_engine.py) checks for compliance (duplicates, missing VAT, etc.).
5.  **Persistence**: The document is saved to [`PostgreSQL`](./storage/postgres_repository.py) and the raw file to S3/Local storage.
6.  **Notification**: An alert is sent to the Admin if the invoice is over a certain limit or contains anomalies.
7.  **Sync**: Data is optionally mirrored to Google Sheets via [`sheet_tools.py`](./tools/sheet_tools.py).

---

## 🚀 Getting Started

1.  **Environment**: Configure your `.env` with Gemini, WhatsApp, and Postgres credentials.
2.  **Database**: Run `python main.py` - it will automatically execute migrations in [`storage/migrations/`](./storage/migrations/).
3.  **Frontend**: Run `npm run build` inside `webapp/damshique-bot-ui/` to bundle the dashboard.
4.  **Launch**: Run `python main.py` to start the FastAPI server and Webhook listener.

---

## 🔒 Security Roles
-   **Employee**: Can upload invoices and query only their own spend history via WhatsApp.
-   **Admin**: Full access to the Dashboard, Audit Logs, Merchant Registry, and Company-wide exports.
