from fastapi import APIRouter, Header, HTTPException, Depends, Body, Request
from typing import Optional, List, Dict, Any
from storage.postgres_repository import (
    get_all_invoices, 
    get_invoice_detail, 
    get_db_connection,
    get_all_users,
    list_pending_requests,
    create_user_request,
    approve_user_request,
    reject_user_request,
    delete_system_user,
    get_report_stats,
    get_bot_activity_logs,
    get_audit_logs,
    log_bot_interaction,
    get_merchants,
    get_notifications,
    sanitize_file_url
)
from tools.conversation_tools.intent_classifier import classify_bot_intent
from tools.query_engine import QueryEngine
from tools.export_tools import (
    generate_custom_export, 
    generate_audit_export, 
    generate_bot_export,
    generate_merchants_export,
    generate_employees_export,
    generate_notifications_export,
    generate_advanced_report
)
from fastapi.responses import FileResponse
from tools.messaging_tools.whatsapp import send_whatsapp
import os
import uuid

router = APIRouter(prefix="/api/admin", tags=["Admin"])

ADMIN_TOKEN_ENV = os.getenv("ADMIN_TOKEN") or os.getenv("ADMIN_API_TOKEN") or "default_secret_token"

async def verify_admin(
    request: Request,
    x_api_token: Optional[str] = Header(None, alias="X-API-Token"),
    authorization: Optional[str] = Header(None),
    token: Optional[str] = None
):
    """
    Verify admin access by validating session token against database.
    Falls back to environment tokens for backward compatibility.
    """
    # 1. Try X-API-Token (case-insensitive)
    incoming = x_api_token
    
    # 2. Try URL parameter
    if not incoming: incoming = token
    
    # 3. Try Bearer token
    if not incoming and authorization and "Bearer " in authorization:
        incoming = authorization.split("Bearer ")[-1].strip()
    
    if not incoming or incoming == "None" or incoming == "":
        raise HTTPException(status_code=403, detail="No authentication token provided")
    
    # First, check if it's a valid session token from database
    conn = await get_db_connection()
    if conn:
        try:
            user = await conn.fetchrow("""
                SELECT phone, name, role, is_approved 
                FROM system_users 
                WHERE session_token = $1 AND role = 'admin' AND is_approved = TRUE
            """, incoming)
            
            if user:
                await conn.close()
                return incoming
        except Exception as e:
            print(f"Session token validation error: {e}")
        finally:
            if conn:
                await conn.close()
    
    # Fallback: Check environment tokens for backward compatibility
    ALLOWED = {
        str(os.getenv("ADMIN_TOKEN")),
        str(os.getenv("ADMIN_API_TOKEN")),
        "default_secret_token"
    }
    
    if incoming in ALLOWED:
        return incoming
    
    print(f"DEBUG: Auth DENIED for token: {incoming[:10] if incoming else 'NONE'}...")
    raise HTTPException(
        status_code=403, 
        detail="Access Denied. Invalid or expired session token."
    )

# --- Invoice APIs ---
@router.get("/invoices", response_model=List[dict])
async def list_invoices(limit: int = 100, token: str = Depends(verify_admin)):
    return await get_all_invoices(limit)

@router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str, token: str = Depends(verify_admin)):
    invoice = await get_invoice_detail(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.post("/invoices/{invoice_id}/process")
async def process_invoice(invoice_id: str, token: str = Depends(verify_admin)):
    conn = await get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        await conn.execute("UPDATE invoices SET status = 'approved' WHERE invoice_id = $1", invoice_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        await conn.close()

@router.post("/invoices/bulk-action")
async def bulk_invoice_action(payload: Dict[str, Any] = Body(...), token: str = Depends(verify_admin)):
    """
    Handle bulk operations: approve, reject, delete
    """
    invoice_ids = payload.get("invoice_ids", [])
    action = payload.get("action")
    
    if not invoice_ids or not action:
        raise HTTPException(status_code=400, detail="invoice_ids and action are required")
        
    # Validate UUIDs to prevent database crashes
    valid_ids = []
    for i in invoice_ids:
        try:
            uuid.UUID(str(i))
            valid_ids.append(i)
        except ValueError:
            print(f"WARNING: Ignored invalid UUID in bulk action: {i}")
            
    if not valid_ids:
        raise HTTPException(status_code=400, detail="No valid UUIDs provided in invoice_ids")
        
    invoice_ids = valid_ids
        
    conn = await get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    print(f"DEBUG: Bulk Action: {action}, IDs: {invoice_ids}")
    
    try:
        async with conn.transaction():
            if action == "approve":
                await conn.execute("UPDATE invoices SET status = 'approved' WHERE invoice_id = ANY($1::uuid[])", invoice_ids)
            elif action == "reject":
                await conn.execute("UPDATE invoices SET status = 'rejected' WHERE invoice_id = ANY($1::uuid[])", invoice_ids)
            elif action == "delete":
                # Delete line items first due to foreign key constraints (cascading might handle this but safer to be explicit if not)
                await conn.execute("DELETE FROM invoice_line_items WHERE invoice_id = ANY($1::uuid[])", invoice_ids)
                await conn.execute("DELETE FROM invoices WHERE invoice_id = ANY($1::uuid[])", invoice_ids)
            else:
                raise HTTPException(status_code=400, detail=f"Invalid action: {action}")
                
        return {"status": "success", "count": len(invoice_ids), "action": action}
    except Exception as e:
        print(f"ERROR in bulk_invoice_action: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        await conn.close()

# --- User Management APIs ---
@router.get("/users")
async def list_users(token: str = Depends(verify_admin)):
    return await get_all_users()

@router.get("/export")
async def export_data(start_date: Optional[str] = None, end_date: Optional[str] = None, token: str = Depends(verify_admin)):
    file_path = await generate_custom_export(start_date, end_date)
    if not file_path:
        raise HTTPException(status_code=404, detail="No data found for the given range")
    return FileResponse(file_path, filename=os.path.basename(file_path))

@router.get("/export-audit")
async def export_audit(token: str = Depends(verify_admin)):
    file_path = await generate_audit_export()
    if not file_path:
        raise HTTPException(status_code=404, detail="No audit logs to export")
    return FileResponse(file_path, filename=os.path.basename(file_path))

@router.get("/export-bot-activity")
async def export_bot_activity(token: str = Depends(verify_admin)):
    file_path = await generate_bot_export()
    if not file_path:
        raise HTTPException(status_code=404, detail="No bot activity to export")
    return FileResponse(file_path, filename=os.path.basename(file_path))

@router.get("/export-merchants")
async def export_merchants(token: str = Depends(verify_admin)):
    file_path = await generate_merchants_export()
    if not file_path:
        raise HTTPException(status_code=404, detail="No merchants to export")
    return FileResponse(file_path, filename=os.path.basename(file_path))

@router.get("/export-employees")
async def export_employees(token: str = Depends(verify_admin)):
    file_path = await generate_employees_export()
    if not file_path:
        raise HTTPException(status_code=404, detail="No employees to export")
    return FileResponse(file_path, filename=os.path.basename(file_path))

@router.get("/export-notifications")
async def export_notifications(token: str = Depends(verify_admin)):
    file_path = await generate_notifications_export()
    if not file_path:
        raise HTTPException(status_code=404, detail="No notifications to export")
    return FileResponse(file_path, filename=os.path.basename(file_path))

@router.get("/export-advanced-report")
async def export_advanced_report(token: str = Depends(verify_admin)):
    file_path = await generate_advanced_report()
    if not file_path:
        raise HTTPException(status_code=404, detail="No data to generate report")
    return FileResponse(file_path, filename=os.path.basename(file_path))

@router.get("/requests")
async def list_requests(token: str = Depends(verify_admin)):
    return await list_pending_requests()

@router.post("/users/request")
async def submit_user_request(payload: Dict[str, Any] = Body(...)):
    """Registration endpoint for new users to submit their profile for approval"""
    from api.auth_api import hash_password
    
    phone = payload.get("phone")
    name = payload.get("name")
    username = payload.get("username")
    password = payload.get("password")
    details = payload.get("details", "Web registration")
    
    if not phone or not name or not password or not username:
        raise HTTPException(status_code=400, detail="Name, Phone, Username and Password are required")
        
    # Hash the password for secure storage during the request phase
    pw_hash = hash_password(password)
    
    success = await create_user_request(phone, name, username, pw_hash, details)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to submit registration request")
    
    return {"status": "success", "message": "Access request submitted. Please wait for administrator approval."}

@router.post("/requests/{phone}/approve")
async def approve_request(phone: str, role: str = "employee", token: str = Depends(verify_admin)):
    success = await approve_user_request(phone, role)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to approve request")
    
    # Send Notification to User
    notification_text = "🎉 Your access to the Damshique Expense System has been APPROVED! You can now send invoices and ask questions."
    await send_whatsapp(phone, notification_text)
    
    return {"status": "success", "phone": phone}

@router.post("/users")
async def create_user_direct(payload: Dict[str, Any] = Body(...), token: str = Depends(verify_admin)):
    phone = payload.get("phone")
    name = payload.get("name")
    role = payload.get("role", "employee")
    
    if not phone or not name:
        raise HTTPException(status_code=400, detail="Phone and Name are required")
        
    conn = await get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        await conn.execute("""
            INSERT INTO system_users (phone, name, role, is_approved)
            VALUES ($1, $2, $3, TRUE)
            ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, is_approved = TRUE
        """, phone, name, role)
        
        # Notify user
        await send_whatsapp(phone, f"👋 Hi {name}! You have been added as a {role} to the Damshique system. You can start by sending an invoice.")
        
        return {"status": "success", "phone": phone}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        await conn.close()

@router.post("/requests/{phone}/reject")
async def reject_request(phone: str, token: str = Depends(verify_admin)):
    success = await reject_user_request(phone)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to reject request")
    return {"status": "success", "phone": phone}

@router.delete("/users/{phone}")
async def delete_user(phone: str, token: str = Depends(verify_admin)):
    success = await delete_system_user(phone)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete user")
    return {"status": "success", "phone": phone}

@router.get("/reports")
async def get_reports_data(token: str = Depends(verify_admin)):
    return await get_report_stats()

@router.get("/bot-activity")
async def get_bot_activity(token: str = Depends(verify_admin)):
    return await get_bot_activity_logs()

@router.get("/audit-logs")
async def get_system_audit_logs(token: str = Depends(verify_admin)):
    return await get_audit_logs()

@router.get("/merchants")
async def list_merchants(token: str = Depends(verify_admin)):
    return await get_merchants()

@router.get("/notifications")
async def list_notifications(token: str = Depends(verify_admin)):
    return await get_notifications()

@router.get("/merchants/{name}/invoices")
async def list_merchant_invoices(name: str, token: str = Depends(verify_admin)):
    conn = await get_db_connection()
    if not conn: return []
    try:
        rows = await conn.fetch("""
            SELECT i.*, u.name as user_name 
            FROM invoices i
            LEFT JOIN system_users u ON i.user_id = u.phone
            WHERE i.vendor_name = $1
            ORDER BY i.invoice_date DESC
        """, name)
        results = []
        for r in rows:
            d = dict(r)
            d["file_url"] = sanitize_file_url(d.get("file_url"))
            results.append(d)
        return results
    finally:
        await conn.close()

@router.get("/users/{phone}/invoices")
async def list_user_invoices(phone: str, token: str = Depends(verify_admin)):
    conn = await get_db_connection()
    if not conn: return []
    try:
        rows = await conn.fetch("""
            SELECT i.*, u.name as user_name 
            FROM invoices i
            LEFT JOIN system_users u ON i.user_id = u.phone
            WHERE i.user_id = $1
            ORDER BY i.invoice_date DESC
        """, phone)
        results = []
        for r in rows:
            d = dict(r)
            d["file_url"] = sanitize_file_url(d.get("file_url"))
            results.append(d)
        return results
    finally:
        await conn.close()

# --- Admin AI Chat API ---
@router.post("/chat")
async def admin_chat(payload: Dict[str, Any] = Body(...), token: str = Depends(verify_admin)):
    """
    Executes a fact-based AI chat for the admin dashboard.
    """
    user_query = payload.get("query")
    history = payload.get("history", [])
    if not user_query:
        raise HTTPException(status_code=400, detail="Query is required")

    from tools.conversation_tools.context_manager import get_conversation_context, update_conversation_context
    
    # 1. Get existing context for this admin session
    context = await get_conversation_context("admin_webapp")
    context["history"] = history # Use fresh history from frontend
    
    # 2. Classify Intent
    classification = await classify_bot_intent(user_query, context, is_admin=True)
    intent = classification.get("intent", "unknown")
    entities = classification.get("entities", {})

    # 3. Query Database
    query_results = await QueryEngine.execute_query("WEBAPP_ADMIN", "admin", intent, entities)

    # 4. Generate Fact-based Response
    from tools.conversation_tools.response_generator import generate_bot_response
    response = await generate_bot_response(user_query, query_results, context)

    # 5. Update Context (Save last invoice ID if found)
    results = query_results.get("results", [])
    last_id = None
    if results and isinstance(results, list) and len(results) > 0:
        last_id = results[0].get("invoice_id")
    elif query_results.get("summary") and isinstance(query_results.get("summary"), dict):
        last_id = query_results.get("summary", {}).get("invoice_id")
        
    await update_conversation_context("admin_webapp", last_invoice_id=last_id, last_query_type=intent)

    # 6. Log Interaction
    await log_bot_interaction("admin-webapp", user_query, response, intent, 1.0, "webapp")

    # 7. Generate Chart Data (if requested)
    chart_config = None
    if "chart" in user_query.lower() or "graph" in user_query.lower():
        results = query_results.get("results", [])
        if isinstance(results, list) and len(results) > 0:
            import pandas as pd
            try:
                df = pd.DataFrame(results)
                
                # Normalize columns
                if "total_amount" in df.columns:
                    df["amount"] = pd.to_numeric(df["total_amount"], errors='coerce').fillna(0)
                elif "amount" in df.columns:
                    df["amount"] = pd.to_numeric(df["amount"], errors='coerce').fillna(0)
                else:
                    print("Chart generation skipped: No amount column found in results")
                
                # Only proceed if amount column exists
                if "amount" in df.columns:
                    chart_type = "bar" # Default
                    if "pie" in user_query.lower():
                        chart_type = "pie"
                    
                    # Determine Grouping
                    group_by = "vendor_name" # Default
                    if "category" in user_query.lower() and "category" in df.columns:
                        group_by = "category"
                    elif "month" in user_query.lower() or "trend" in user_query.lower():
                        if "invoice_date" in df.columns:
                            df["month"] = pd.to_datetime(df["invoice_date"], errors='coerce').dt.strftime('%b %Y')
                            group_by = "month"
                            chart_type = "bar" # Force bar for trends

                    if group_by in df.columns:
                        # Aggregate
                        agg = df.groupby(group_by)["amount"].sum().reset_index()
                        agg = agg.sort_values("amount", ascending=False).head(10) # Top 10
                        
                        chart_data = []
                        for _, row in agg.iterrows():
                            chart_data.append({
                                "name": str(row[group_by]),
                                "value": float(row["amount"])
                            })
                            
                        if chart_data:
                            chart_config = {
                                "type": chart_type,
                                "title": f"Spend by {group_by.replace('_', ' ').title()}",
                                "data": chart_data
                            }
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Chart generation failed: {e}", exc_info=True)
                print(f"Chart generation failed: {e}")

    return {
        "response": response,
        "intent": intent,
        "query_results": query_results,
        "chart": chart_config
    }

# --- Stats API (Shared) ---
@router.get("/stats")
async def get_stats(token: str = Depends(verify_admin)):
    conn = await get_db_connection()
    if not conn:
        return {"error": "Database connection failed"}
    try:
        # Get real counts but handle missing tables gracefully
        async def safe_count(table):
            try:
                return await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
            except:
                return 0

        invoice_count = await safe_count("invoices")
        audit_count = await safe_count("activity_audit_log")
        user_count = await safe_count("system_users")
        pending_count = await safe_count("user_registration_requests")
        bot_interaction_count = await safe_count("bot_interactions")
        
        # Count unique merchants
        merchant_count = 0
        try:
            merchant_count = await conn.fetchval("SELECT COUNT(DISTINCT vendor_name) FROM invoices WHERE vendor_name IS NOT NULL") or 0
        except:
            pass
        
        return {
            "version": "v1.25-debug",
            "employees": user_count, 
            "merchants": merchant_count,
            "invoices": invoice_count,
            "reports": 12,
            "botActivity": bot_interaction_count,
            "aiQueue": pending_count,
            "users": user_count,
            "audits": audit_count
        }
    except Exception as e:
        print(f"Stats error: {e}")
        return {"error": str(e)}
    finally:
        await conn.close()
