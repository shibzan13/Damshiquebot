from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Optional, List, Dict, Any
from storage.postgres_repository import get_db_connection
from api.analytics_api import verify_admin
import json

router = APIRouter(prefix="/api/automation", tags=["Automation"])

@router.get("/rules")
async def get_approval_rules(token: str = Depends(verify_admin)):
    conn = await get_db_connection()
    if not conn: return []
    try:
        rows = await conn.fetch("SELECT * FROM approval_rules ORDER BY priority DESC")
        return [dict(r) for r in rows]
    finally:
        await conn.close()

@router.post("/rules")
async def create_approval_rule(rule: Dict[str, Any] = Body(...), token: str = Depends(verify_admin)):
    conn = await get_db_connection()
    if not conn: raise HTTPException(status_code=500)
    try:
        await conn.execute("""
            INSERT INTO approval_rules (name, priority, conditions, approver_role, is_active)
            VALUES ($1, $2, $3, $4, $5)
        """, rule['name'], rule.get('priority', 1), json.dumps(rule['conditions']), 
           rule.get('approver_role', 'manager'), rule.get('is_active', True))
        return {"success": True}
    finally:
        await conn.close()

@router.get("/purchase-orders")
async def get_purchase_orders(token: str = Depends(verify_admin)):
    conn = await get_db_connection()
    if not conn: return []
    try:
        rows = await conn.fetch("SELECT * FROM purchase_orders ORDER BY created_at DESC")
        return [dict(r) for r in rows]
    finally:
        await conn.close()

@router.post("/purchase-orders")
async def create_purchase_order(po: Dict[str, Any] = Body(...), token: str = Depends(verify_admin)):
    conn = await get_db_connection()
    if not conn: raise HTTPException(status_code=500)
    try:
        await conn.execute("""
            INSERT INTO purchase_orders (po_number, vendor_name, total_amount, currency, status, description)
            VALUES ($1, $2, $3, $4, $5, $6)
        """, po['po_number'], po.get('vendor_name'), po.get('total_amount'), 
           po.get('currency', 'AED'), po.get('status', 'open'), po.get('description'))
        return {"success": True}
    finally:
        await conn.close()

@router.get("/recurring")
async def get_recurring_schedules(token: str = Depends(verify_admin)):
    conn = await get_db_connection()
    if not conn: return []
    try:
        rows = await conn.fetch("SELECT * FROM subscriptions WHERE auto_invoice = TRUE")
        return [dict(r) for r in rows]
    finally:
        await conn.close()

@router.get("/pending-approvals")
async def get_pending_approvals(token: str = Depends(verify_admin)):
    """Invoices that matched an approval rule and are still pending."""
    conn = await get_db_connection()
    if not conn: return []
    try:
        rows = await conn.fetch("""
            SELECT i.*, u.name as user_name
            FROM invoices i
            JOIN system_users u ON i.user_id = u.phone
            WHERE i.status = 'pending' 
              AND i.compliance_flags ? 'required_approver'
            ORDER BY i.created_at DESC
        """)
        return [dict(r) for r in rows]
    finally:
        await conn.close()
