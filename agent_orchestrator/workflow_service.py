import logging
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from storage.postgres_repository import get_db_connection

logger = logging.getLogger(__name__)

class WorkflowService:
    @staticmethod
    async def process_invoice_automation(invoice_id: str):
        """
        Runs the business automation pipeline for a new invoice.
        1. Approval Routing
        2. PO Reconciliation
        3. Payment Status Initialization
        """
        conn = await get_db_connection()
        if not conn: return
        
        try:
            # Fetch invoice details
            invoice = await conn.fetchrow("SELECT * FROM invoices WHERE invoice_id = $1", invoice_id)
            if not invoice: return
            
            # 1. Approval Workflow
            await WorkflowService._apply_approval_rules(conn, invoice)
            
            # 2. PO Reconciliation
            await WorkflowService._reconcile_with_po(conn, invoice)
            
            # 3. Set Default Due Date (e.g., Net 30) if missing
            if not invoice['due_date']:
                due_date = invoice['invoice_date'] + timedelta(days=30) if invoice['invoice_date'] else datetime.now().date() + timedelta(days=30)
                await conn.execute("UPDATE invoices SET due_date = $1 WHERE invoice_id = $2", due_date, invoice_id)

        except Exception as e:
            logger.error(f"Workflow automation failed for {invoice_id}: {e}")
        finally:
            await conn.close()

    @staticmethod
    async def _apply_approval_rules(conn, invoice):
        """Routes invoice for approval based on active rules."""
        rules = await conn.fetch("SELECT * FROM approval_rules WHERE is_active = TRUE ORDER BY priority DESC")
        
        for rule in rules:
            conditions = json.loads(rule['conditions'])
            match = True
            
            # Simple condition matching
            if 'min_amount' in conditions and float(invoice['total_amount'] or 0) < float(conditions['min_amount']):
                match = False
            if 'category' in conditions and invoice['category'] != conditions['category']:
                match = False
                
            if match:
                logger.info(f"Rule '{rule['name']}' matched for invoice {invoice['invoice_id']}. Required: {rule['approver_role']}")
                # If a rule matches, we can update status to 'pending' or some internal 'awaiting_approval' state
                # but for simplicity, we keep it as pending and log the required role
                await conn.execute("""
                    UPDATE invoices 
                    SET compliance_flags = compliance_flags || $1::jsonb
                    WHERE invoice_id = $2
                """, json.dumps({"required_approver": rule['approver_role'], "rule_matched": rule['name']}), invoice['invoice_id'])
                # Break on first high-priority rule? Or apply all? 
                # Let's just track the highest priority one.
                break

    @staticmethod
    async def _reconcile_with_po(conn, invoice):
        """Tries to find a matching Purchase Order."""
        if not invoice['vendor_name'] or not invoice['total_amount']:
            return

        # Simple match by vendor and amount (+/- 1% tolerance)
        po = await conn.fetchrow("""
            SELECT po_id, po_number 
            FROM purchase_orders 
            WHERE status = 'open' 
              AND vendor_name ILIKE $1 
              AND total_amount BETWEEN $2 * 0.99 AND $2 * 1.01
            LIMIT 1
        """, invoice['vendor_name'], invoice['total_amount'])
        
        if po:
            logger.info(f"Reconciled invoice {invoice['invoice_id']} with PO {po['po_number']}")
            await conn.execute("""
                UPDATE invoices SET po_id = $1 WHERE invoice_id = $2
            """, po['po_id'], invoice['invoice_id'])
            
            # If exactly matched, we could potentially auto-approve
            # await conn.execute("UPDATE invoices SET status = 'approved' WHERE invoice_id = $1", invoice['invoice_id'])

    @staticmethod
    async def run_scheduler_tasks():
        """
        Daily/Hourly background tasks:
        1. Send payment reminders
        2. Create recurring invoices
        """
        conn = await get_db_connection()
        if not conn: return
        
        try:
            # 1. Payment Reminders (Upcoming in 3 days or Overdue)
            overdue = await conn.fetch("""
                SELECT i.*, u.phone 
                FROM invoices i
                JOIN system_users u ON i.user_id = u.phone
                WHERE i.payment_status IN ('unpaid', 'partially_paid')
                  AND (i.due_date = CURRENT_DATE + INTERVAL '3 days' OR i.due_date < CURRENT_DATE)
                  AND i.status = 'approved'
            """)
            
            for inv in overdue:
                # Logic to trigger WhatsApp notification
                msg = f"🔔 *Payment Reminder*\n\nYour invoice from *{inv['vendor_name']}* for *{inv['total_amount']} {inv['currency']}* is {'⚠️ OVERDUE' if inv['due_date'] < datetime.now().date() else 'due soon'}.\n\n📅 Due Date: {inv['due_date']}"
                
                from tools.messaging_tools.whatsapp import send_whatsapp
                await send_whatsapp(inv['user_id'], msg)

                await conn.execute("""
                    INSERT INTO notification_events (user_id, event_type, message)
                    VALUES ($1, 'payment_reminder', $2)
                """, inv['user_id'], msg)

            # 2. Recurring Invoice Generation
            today = datetime.now().date()
            recurring = await conn.fetch("""
                SELECT * FROM subscriptions 
                WHERE auto_invoice = TRUE 
                  AND (next_billing_date IS NULL OR next_billing_date <= $1)
            """, today)
            
            for sub in recurring:
                # Create a new invoice entry
                invoice_data = {
                    "vendor_name": sub['vendor_name'],
                    "total_amount": sub['amount'],
                    "currency": sub['currency'],
                    "category": sub['category'],
                    "invoice_date": today.isoformat(),
                    "status": 'pending'
                }
                
                # We would call persist_invoice_intelligence here (simplified for this snippet)
                from storage.postgres_repository import persist_invoice_intelligence
                await persist_invoice_intelligence(sub['user_id'], invoice_data)
                
                # Calculate next billing date
                freq = sub['frequency']
                next_date = today
                if freq == 'monthly': next_date += timedelta(days=30)
                elif freq == 'weekly': next_date += timedelta(days=7)
                elif freq == 'yearly': next_date += timedelta(days=365)
                
                await conn.execute("""
                    UPDATE subscriptions 
                    SET last_billing_date = $1, next_billing_date = $2 
                    WHERE subscription_id = $3
                """, today, next_date, sub['subscription_id'])

        except Exception as e:
            logger.error(f"Scheduler tasks failed: {e}")
        finally:
            await conn.close()

workflow_service = WorkflowService()
