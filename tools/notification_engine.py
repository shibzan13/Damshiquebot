import logging
import json
from typing import Dict, Any, Optional
from storage.postgres_repository import get_db_connection
from tools.messaging_tools.whatsapp import send_whatsapp

logger = logging.getLogger(__name__)

class NotificationEngine:
    """
    Step 4: Rule-based Notifications Engine.
    Event-driven notifications for users and admins.
    """
    broadcaster = None

    @staticmethod
    def set_broadcaster(func):
        NotificationEngine.broadcaster = func

    @staticmethod
    async def trigger_event(user_id: str, event_type: str, data: Dict[str, Any]):
        rules = {
            "invoice_received": NotificationEngine._rule_invoice_received,
            "invoice_rejected": NotificationEngine._rule_invoice_rejected,
            "duplicate_detected": NotificationEngine._rule_duplicate_detected,
            "high_value_invoice": NotificationEngine._rule_high_value,
            "low_confidence_extraction": NotificationEngine._rule_low_confidence
        }
        
        handler = rules.get(event_type)
        if handler:
            await handler(user_id, data)

    @staticmethod
    async def _rule_invoice_received(user_id, data):
        msg = f"✅ Invoice from {data.get('vendor_name')} received and processed."
        await NotificationEngine._log_and_send(user_id, "invoice_received", msg, data)

    @staticmethod
    async def _rule_invoice_rejected(user_id, data):
        reason = data.get("reason", "Unknown reason")
        msg = f"❌ Invoice from {data.get('vendor_name')} was REJECTED.\nReason: {reason}"
        await NotificationEngine._log_and_send(user_id, "invoice_rejected", msg, data)

    @staticmethod
    async def _rule_duplicate_detected(user_id, data):
        msg = f"⚠️ Duplicate detected: Invoice from {data.get('vendor_name')} (Total: {data.get('total_amount')}) has already been submitted."
        await NotificationEngine._log_and_send(user_id, "duplicate_detected", msg, data)

    @staticmethod
    async def _rule_high_value(user_id, data):
        # Admin Notification
        threshold = 5000 # Example
        if float(data.get("total_amount", 0)) > threshold:
            admin_msg = f"🚨 HIGH VALUE INVOICE: {data.get('vendor_name')} - {data.get('total_amount')} {data.get('currency')} by user {user_id}"
            # assuming we have a way to find admins
            # for now, log it as an event with specific flag
            await NotificationEngine._log_and_send(user_id, "high_value_invoice", admin_msg, data)

    @staticmethod
    async def _rule_low_confidence(user_id, data):
        msg = f"📝 Note: Invoice from {data.get('vendor_name')} was extracted with low confidence. Please check if details are correct."
        await NotificationEngine._log_and_send(user_id, "low_confidence_extraction", msg, data)

    @staticmethod
    async def _log_and_send(user_id, event_type, message, payload):
        conn = await get_db_connection()
        if not conn: return
        
        try:
            # Store in DB
            await conn.execute("""
                INSERT INTO notification_events (user_id, event_type, message, payload)
                VALUES ($1, $2, $3, $4)
            """, user_id, event_type, message, json.dumps(payload, default=str))
            
            # Send via WhatsApp
            await send_whatsapp(user_id, message)

            # Broadcast to WebSockets
            if NotificationEngine.broadcaster:
                await NotificationEngine.broadcaster({
                    "type": event_type,
                    "user_id": user_id,
                    "message": message,
                    "data": payload
                })
        except Exception as e:
            logger.error(f"Failed to process notification: {e}")
        finally:
            await conn.close()
