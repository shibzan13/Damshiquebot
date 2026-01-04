import os
import asyncpg
import hashlib
import logging
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

import asyncio

async def get_db_connection(retries=5, delay=2):
    url = os.getenv("DATABASE_URL")
    if not url:
        logger.error("❌ DATABASE_URL not set in environment!")
        return None
        
    for i in range(retries):
        try:
            conn = await asyncpg.connect(url)
            return conn
        except Exception as e:
            if i < retries - 1:
                logger.warning(f"PostgreSQL connection attempt {i+1} failed: {e}. Retrying in {delay}s...")
                await asyncio.sleep(delay)
            else:
                logger.error(f"PostgreSQL connection failed after {retries} attempts: {e}")
                return None

async def check_db_health():
    """ Returns True if DB is reachable and migrations are likely applied. """
    conn = await get_db_connection(retries=1)
    if not conn: return False, "Unreachable"
    try:
        exists = await conn.fetchval("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices')")
        if exists:
            return True, "Healthy"
        return False, "Tables Missing"
    except Exception as e:
        return False, str(e)
    finally:
        await conn.close()

def generate_invoice_hash(data: Dict[str, Any]) -> str:
    """
    Generate a unique hash for idempotency based on vendor, amount, and date.
    """
    raw_str = f"{data.get('vendor_name')}|{data.get('total_amount')}|{data.get('invoice_date')}"
    return hashlib.sha256(raw_str.encode()).hexdigest()

async def log_activity(user_id: str, action: str, entity_type: str, entity_id: Optional[str] = None, before_state: Optional[Dict] = None, after_state: Optional[Dict] = None):
    """
    Step 5: Audit Trail.
    Logs every action into activity_audit_log for Finance trust.
    """
    conn = await get_db_connection()
    if not conn: return
    
    try:
        await conn.execute("""
            INSERT INTO activity_audit_log (user_id, action, entity_type, entity_id, before_state, after_state)
            VALUES ($1, $2, $3, $4, $5, $6)
        """, user_id, action, entity_type, entity_id if entity_id else None, 
        json.dumps(before_state) if before_state else None,
        json.dumps(after_state) if after_state else None)
    except Exception as e:
        logger.error(f"Audit logging failed: {e}")
    finally:
        await conn.close()

async def persist_invoice_intelligence(
    user_id: str, 
    invoice_data: Dict[str, Any], 
    file_url: Optional[str] = None,
    whatsapp_media_id: Optional[str] = None,
    compliance_results: Optional[Dict[str, Any]] = None,
    embedding: Optional[List[float]] = None,
    raw_text: Optional[str] = None
) -> Optional[str]:
    """
    Step 4: Persist Summary & Line Items with Transactional Integrity.
    """
    conn = await get_db_connection()
    if not conn:
        return None

    # Calculate hash for idempotency
    file_hash = generate_invoice_hash(invoice_data)
    
    invoice_id = None
    try:
        async with conn.transaction():
            # 1. Check for duplicates
            existing = await conn.fetchval(
                "SELECT invoice_id FROM invoices WHERE file_hash = $1", 
                file_hash
            )
            if existing:
                logger.info(f"Duplicate invoice detected: {existing}")
                return str(existing)

            # 2. Insert Summary
            invoice_id = await conn.fetchval("""
                INSERT INTO invoices (
                    user_id, vendor_name, invoice_date, currency, subtotal, 
                    tax_amount, total_amount, confidence_score, line_items_status, 
                    file_url, file_hash, whatsapp_media_id, status, version, is_latest,
                    compliance_flags, cost_center, embedding, raw_text, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1, TRUE, $14, $15, $16, $17, CURRENT_TIMESTAMP)
                RETURNING invoice_id
            """, 
            user_id, 
            invoice_data.get("vendor_name"),
            datetime.strptime(invoice_data["invoice_date"], "%Y-%m-%d").date() if invoice_data.get("invoice_date") else None,
            invoice_data.get("currency", "AED"),
            invoice_data.get("subtotal"),
            invoice_data.get("tax_amount"),
            invoice_data.get("total_amount"),
            invoice_data.get("confidence_score"),
            invoice_data.get("line_items_status"),
            file_url,
            file_hash,
            whatsapp_media_id,
            'pending',
            json.dumps(compliance_results.get("compliance_flags", [])) if compliance_results else None,
            invoice_data.get("cost_center"),
            str(embedding) if embedding else None,
            raw_text
            )

            # 3. Log Activity
            await log_activity(user_id, 'submit', 'invoice', str(invoice_id), after_state=invoice_data)

            # 4. Insert Line Items
            line_items = invoice_data.get("line_items", [])
            if line_items:
                item_data = [
                    (
                        invoice_id,
                        item.get("description"),
                        item.get("quantity"),
                        item.get("unit_price"),
                        item.get("tax"),
                        item.get("line_total")
                    )
                    for item in line_items
                ]
                
                await conn.executemany("""
                    INSERT INTO invoice_line_items (
                        invoice_id, description, quantity, unit_price, tax, line_total
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                """, item_data)
                logger.info(f"Inserted {len(line_items)} line items for invoice {invoice_id}")
                
        return str(invoice_id) if invoice_id else None

    except Exception as e:
        logger.error(f"Persistence failed: {e}")
        return None
    finally:
        await conn.close()

def sanitize_file_url(url: str) -> str:
    if not url: return None
    
    # Use pre-signed URLs if it's an S3 URL
    if "amazonaws.com" in url:
        from tools.storage_tools.s3_storage import storage_service
        return storage_service.generate_presigned_url(url)
        
    # Normalize slashes
    url = url.replace("\\", "/")
    
    # Check if it contains uploads
    if "uploads/" in url:
        # Split by uploads/ and take the last part
        parts = url.split("uploads/")
        if len(parts) > 1:
            return f"/uploads/{parts[-1]}"
    
    # Fallback for relative paths that might just be the filename
    if not "/" in url:
         return f"/uploads/{url}"
         
    return url

async def get_all_invoices(limit: int = 50):
    conn = await get_db_connection()
    if not conn: return []
    # Join with system_users to show names instead of just phone numbers
    query = """
        SELECT i.*, u.name as user_name 
        FROM invoices i
        LEFT JOIN system_users u ON i.user_id = u.phone
        ORDER BY i.created_at DESC 
        LIMIT $1
    """
    rows = await conn.fetch(query, limit)
    await conn.close()
    
    results = []
    for r in rows:
        d = dict(r)
        d["file_url"] = sanitize_file_url(d.get("file_url"))
        results.append(d)
    return results

async def get_invoice_detail(invoice_id: str):
    conn = await get_db_connection()
    if not conn: return None
    
    invoice = await conn.fetchrow("SELECT * FROM invoices WHERE invoice_id = $1", invoice_id)
    if not invoice:
        await conn.close()
        return None
        
    items = await conn.fetch("SELECT * FROM invoice_line_items WHERE invoice_id = $1", invoice_id)
    await conn.close()
    
    res = dict(invoice)
    res["line_items"] = [dict(i) for i in items]
    return res

async def get_invoice_audit(invoice_id: str):
    """
    Step 4: Explainability Mode.
    Returns extraction metadata and validation details.
    """
    conn = await get_db_connection()
    if not conn: return None
    
    invoice = await conn.fetchrow("""
        SELECT invoice_id, confidence_score, status, line_items_status, whatsapp_media_id, created_at, version
        FROM invoices WHERE invoice_id = $1
    """, invoice_id)
    await conn.close()
    
    if not invoice: return None
    d = dict(invoice)
    d["file_url"] = sanitize_file_url(d.get("file_url"))
    return d

# --- User Management (PostgreSQL) ---

async def get_system_user(phone: str) -> Optional[Dict[str, Any]]:
    conn = await get_db_connection()
    if not conn: return None
    row = await conn.fetchrow("SELECT * FROM system_users WHERE phone = $1", phone)
    await conn.close()
    return dict(row) if row else None

async def create_user_request(phone: str, name: str, username: Optional[str] = None, password_hash: Optional[str] = None, details: Optional[str] = None):
    conn = await get_db_connection()
    if not conn: return False
    try:
        await conn.execute("""
            INSERT INTO user_registration_requests (phone, name, username, password_hash, details)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (phone) DO UPDATE SET 
                name = EXCLUDED.name, 
                username = EXCLUDED.username,
                password_hash = EXCLUDED.password_hash,
                details = EXCLUDED.details, 
                status = 'pending'
        """, phone, name, username, password_hash, details)
        return True
    except Exception as e:
        logger.error(f"Failed to create user request: {e}")
        return False
    finally:
        await conn.close()

async def list_pending_requests():
    conn = await get_db_connection()
    if not conn: return []
    rows = await conn.fetch("SELECT * FROM user_registration_requests WHERE status = 'pending' ORDER BY created_at DESC")
    await conn.close()
    return [dict(r) for r in rows]

async def approve_user_request(phone: str, role: str = 'employee'):
    conn = await get_db_connection()
    if not conn: return False
    try:
        async with conn.transaction():
            # 1. Get request details
            req = await conn.fetchrow("SELECT name, username, password_hash FROM user_registration_requests WHERE phone = $1", phone)
            if not req: return False
            
            # 2. Add to system_users
            await conn.execute("""
                INSERT INTO system_users (phone, name, username, password_hash, role, is_approved)
                VALUES ($1, $2, $3, $4, $5, TRUE)
                ON CONFLICT (phone) DO UPDATE SET 
                    is_approved = TRUE, 
                    role = $5,
                    username = EXCLUDED.username,
                    password_hash = EXCLUDED.password_hash
            """, phone, req['name'], req['username'], req['password_hash'], role)
            
            # 3. Update request status
            await conn.execute("UPDATE user_registration_requests SET status = 'approved' WHERE phone = $1", phone)
            return True
    except Exception as e:
        logger.error(f"Approval failed: {e}")
        return False
    finally:
        if conn:
            await conn.close()

async def get_all_users():
    conn = await get_db_connection()
    if not conn: return []
    rows = await conn.fetch("SELECT * FROM system_users ORDER BY created_at DESC")
    await conn.close()
    return [dict(r) for r in rows]

async def delete_system_user(phone: str):
    conn = await get_db_connection()
    if not conn: return False
    try:
        await conn.execute("DELETE FROM system_users WHERE phone = $1", phone)
        # Also reject any pending request for them
        await conn.execute("UPDATE user_registration_requests SET status = 'rejected' WHERE phone = $1", phone)
        return True
    except Exception as e:
        logger.error(f"Failed to delete user: {e}")
        return False
    finally:
        await conn.close()

async def reject_user_request(phone: str):
    conn = await get_db_connection()
    if not conn: return False
    try:
        await conn.execute("UPDATE user_registration_requests SET status = 'rejected' WHERE phone = $1", phone)
        return True
    except Exception as e:
        logger.error(f"Failed to reject request: {e}")
        return False
    finally:
        await conn.close()

async def run_pg_migrations():
    """ Runs all SQL migrations in the migrations directory. """
    url = os.getenv("DATABASE_URL")
    if not url:
        logger.error("❌ DATABASE_URL not found in environment!")
        return

    conn = await get_db_connection()
    if not conn:
        logger.error("❌ Failed to connect to PostgreSQL for migrations.")
        return
    
    try:
        # Get all .sql files in storage/migrations
        migration_dir = os.path.join(os.getcwd(), "storage", "migrations")
        if not os.path.exists(migration_dir):
            script_dir = os.path.dirname(os.path.abspath(__file__))
            migration_dir = os.path.join(script_dir, "migrations")
            
        if not os.path.exists(migration_dir):
            logger.error(f"❌ Migration directory NOT FOUND: {migration_dir}")
            return

        migration_files = sorted([f for f in os.listdir(migration_dir) if f.endswith(".sql")])
        
        logger.info(f"🚀 Found {len(migration_files)} migration files. Starting migration...")
        
        # 1. Try to enable uuid-ossp separately
        try:
            await conn.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
            logger.info("✅ uuid-ossp extension enabled.")
        except Exception as e:
            logger.warning(f"⚠️ Could not enable uuid-ossp: {e}")

        for filename in migration_files:
            file_path = os.path.join(migration_dir, filename)
            logger.info(f"📜 Applying migration: {filename}...")
            with open(file_path, "r") as f:
                content = f.read()
                try:
                    await conn.execute(content)
                    logger.info(f"✅ {filename} applied.")
                except Exception as e:
                    logger.error(f"❌ Error applying {filename}: {e}")

        # --- CUSTOM PATCHES (Idempotent) ---
        # Bot Interaction Table Patch
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS bot_interactions (
                interaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id TEXT NOT NULL,
                query TEXT NOT NULL,
                response TEXT NOT NULL,
                intent TEXT,
                confidence NUMERIC(5, 4),
                channel TEXT DEFAULT 'whatsapp',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            ALTER TABLE invoices ADD COLUMN IF NOT EXISTS category TEXT;
        """)
        logger.info("✅ Custom patches verified.")

        # 3. Final Verification
        exists = await conn.fetchval("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices')")
        if exists:
            logger.info("📊 Verification: 'invoices' table is PRESENT.")
        else:
            logger.error("❌ CRITICAL: 'invoices' table is STILL MISSING after migration.")

    except Exception as e:
        logger.error(f"❌ Error during PostgreSQL migrations: {e}")
    finally:
        await conn.close()

async def log_bot_interaction(user_id: str, query: str, response: str, intent: str = "unknown", confidence: float = 1.0, channel: str = "whatsapp"):
    conn = await get_db_connection()
    if not conn: return
    try:
        await conn.execute("""
            INSERT INTO bot_interactions (user_id, query, response, intent, confidence, channel)
            VALUES ($1, $2, $3, $4, $5, $6)
        """, user_id, query, response, intent, confidence, channel)
    except Exception as e:
        logger.error(f"Failed to log bot interaction: {e}")
    finally:
        await conn.close()

async def get_report_stats():
    conn = await get_db_connection()
    if not conn: return {"stats": {"total_spend": 0, "total_invoices": 0, "user_count": 0, "avg_invoice": 0}, "revenueData": [], "distribution": [], "topProducts": [], "topCustomers": []}
    try:
        # 1. Basic Stats
        total_spend = await conn.fetchval("SELECT SUM(total_amount) FROM invoices WHERE status = 'approved'") or 0
        total_invoices = await conn.fetchval("SELECT COUNT(*) FROM invoices") or 0
        avg_invoice = await conn.fetchval("SELECT AVG(total_amount) FROM invoices") or 0
        user_count = await conn.fetchval("SELECT COUNT(*) FROM system_users") or 0
        
        # 2. Spend by Month (last 6 months)
        monthly_spend = []
        try:
            monthly_spend = await conn.fetch("""
                SELECT TO_CHAR(invoice_date, 'Mon') as month, SUM(total_amount) as revenue, COUNT(*) as orders
                FROM invoices
                WHERE invoice_date >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY TO_CHAR(invoice_date, 'Mon'), DATE_TRUNC('month', invoice_date)
                ORDER BY DATE_TRUNC('month', invoice_date)
            """)
        except: pass
        
        # 3. Spend by Category
        total_approved = await conn.fetchval("SELECT SUM(total_amount) FROM invoices WHERE status = 'approved'") or 1
        category_spend = []
        try:
            category_spend = await conn.fetch("""
                SELECT COALESCE(cost_center, 'General') as label, 
                       (SUM(total_amount) * 100.0 / $1) as value
                FROM invoices
                WHERE status = 'approved'
                GROUP BY cost_center
                ORDER BY value DESC
                LIMIT 5
            """, total_approved)
        except: pass
        
        # 4. Top Vendors
        top_vendors = []
        try:
            top_vendors = await conn.fetch("""
                SELECT vendor_name as name, COUNT(*) as sales, SUM(total_amount) as revenue
                FROM invoices
                GROUP BY vendor_name
                ORDER BY revenue DESC
                LIMIT 5
            """)
        except: pass
        
        # 5. Top Employees
        top_users = []
        try:
            top_users = await conn.fetch("""
                SELECT u.name, COUNT(i.invoice_id) as orders, COALESCE(SUM(i.total_amount), 0) as revenue
                FROM system_users u
                LEFT JOIN invoices i ON i.user_id = u.phone
                GROUP BY u.name
                ORDER BY revenue DESC
                LIMIT 5
            """)
        except: pass
        
        return {
            "stats": {
                "total_spend": float(total_spend or 0),
                "total_invoices": total_invoices or 0,
                "user_count": user_count or 0,
                "avg_invoice": float(avg_invoice or 0)
            },
            "revenueData": [dict(r) for r in monthly_spend] if monthly_spend else [],
            "distribution": [dict(r) for r in category_spend] if category_spend else [],
            "topProducts": [dict(r) for r in top_vendors] if top_vendors else [],
            "topCustomers": [dict(r) for r in top_users] if top_users else []
        }
    except Exception as e:
        print(f"DB Error (report_stats): {e}")
        return {"stats": {"total_spend": 0, "total_invoices": 0, "user_count": 0, "avg_invoice": 0}, "revenueData": [], "distribution": [], "topProducts": [], "topCustomers": []}
    finally:
        await conn.close()

async def get_bot_activity_logs():
    conn = await get_db_connection()
    if not conn: return []
    try:
        rows = await conn.fetch("""
            SELECT b.*, u.name as user_name
            FROM bot_interactions b
            LEFT JOIN system_users u ON b.user_id = u.phone
            ORDER BY b.created_at DESC
            LIMIT 50
        """)
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"DB Error (bot_activity): {e}")
        return []
    finally:
        await conn.close()

async def get_audit_logs():
    conn = await get_db_connection()
    if not conn: return []
    try:
        rows = await conn.fetch("""
            SELECT a.*, u.name as user_name
            FROM activity_audit_log a
            LEFT JOIN system_users u ON a.user_id = u.phone
            ORDER BY a.created_at DESC
            LIMIT 100
        """)
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"DB Error (audit_logs): {e}")
        return []
    finally:
        await conn.close()

async def get_merchants():
    conn = await get_db_connection()
    if not conn: return []
    try:
        rows = await conn.fetch("""
            SELECT vendor_name as name, 
                   COUNT(*) as total_invoices, 
                   SUM(total_amount) as total_spend,
                   MAX(invoice_date) as last_interaction
            FROM invoices
            WHERE vendor_name IS NOT NULL
            GROUP BY vendor_name
            ORDER BY total_spend DESC
        """)
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"DB Error (merchants): {e}")
        return []
    finally:
        await conn.close()

async def get_notifications():
    conn = await get_db_connection()
    if not conn: return []
    try:
        rows = await conn.fetch("""
            SELECT * FROM notification_events 
            ORDER BY created_at DESC 
            LIMIT 50
        """)
        return [dict(r) for r in rows]
    finally:
        await conn.close()
