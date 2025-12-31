
import pandas as pd
import os
from datetime import datetime
from storage.postgres_repository import get_db_connection

EXPORT_DIR = os.path.join(os.getcwd(), "exports")
os.makedirs(EXPORT_DIR, exist_ok=True)

async def generate_custom_export(start_date: str = None, end_date: str = None, user_id: str = None):
    """
    Generates a simple flat CSV/Excel export for invoices.
    """
    conn = await get_db_connection()
    if not conn: return None
    
    try:
        query = """
            SELECT i.*, u.name as user_name 
            FROM invoices i
            LEFT JOIN system_users u ON i.user_id = u.phone
            WHERE 1=1
        """
        params = []
        if start_date and start_date not in ['null', 'undefined', '']:
            p_idx = len(params) + 1
            query += f" AND i.invoice_date >= ${p_idx}"
            params.append(datetime.strptime(start_date, "%Y-%m-%d").date())
            
        if end_date and end_date not in ['null', 'undefined', '']:
            p_idx = len(params) + 1
            query += f" AND i.invoice_date <= ${p_idx}"
            params.append(datetime.strptime(end_date, "%Y-%m-%d").date())
            
        if user_id:
            p_idx = len(params) + 1
            query += f" AND i.user_id = ${p_idx}"
            params.append(user_id)
            
        query += " ORDER BY i.invoice_date DESC"
        
        rows = await conn.fetch(query, *params)
        
        if not rows: return None
            
        df = pd.DataFrame([dict(r) for r in rows])
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"Invoices_Export_{timestamp}.xlsx"
        file_path = os.path.join(EXPORT_DIR, filename)
        
        # Convert date columns to string for better Excel compatibility
        for col in ['invoice_date', 'created_at', 'updated_at']:
            if col in df.columns:
                df[col] = df[col].astype(str)

        df.to_excel(file_path, index=False)
        return file_path
    finally:
        await conn.close()

async def generate_advanced_report():
    """
    Generates a professional multi-sheet Excel report:
    1. Summary Dashboard (Calculated stats)
    2. Expenses by Category (Tabs for each category or grouped) - logic: One sheet with category grouping.
    3. Expenses by Merchant
    4. Full Raw Data
    """
    conn = await get_db_connection()
    if not conn: return None
    
    try:
        # Fetch all approved invoices for the report
        rows = await conn.fetch("""
            SELECT i.invoice_id, i.invoice_date, i.vendor_name, i.total_amount, i.currency, 
                   i.status, i.cost_center, u.name as employee
            FROM invoices i
            LEFT JOIN system_users u ON i.user_id = u.phone
            WHERE i.status != 'rejected'
            ORDER BY i.invoice_date DESC
        """)
        
        if not rows: return None
        
        data = [dict(r) for r in rows]
        df = pd.DataFrame(data)
        
        # Clean data
        df['total_amount'] = pd.to_numeric(df['total_amount'], errors='coerce').fillna(0)
        df['vendor_name'] = df['vendor_name'].fillna('Unknown')
        df['cost_center'] = df['cost_center'].fillna('Uncategorized')
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"Professional_Expense_Report_{timestamp}.xlsx"
        file_path = os.path.join(EXPORT_DIR, filename)
        
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            # Sheet 1: Executive Summary
            summary_data = {
                'Metric': ['Total Spend', 'Total Invoices', 'Average Invoice Value', 'Top Vendor', 'Top Category'],
                'Value': [
                    df['total_amount'].sum(),
                    len(df),
                    df['total_amount'].mean(),
                    df.groupby('vendor_name')['total_amount'].sum().idxmax() if not df.empty else 'N/A',
                    df.groupby('cost_center')['total_amount'].sum().idxmax() if not df.empty else 'N/A'
                ]
            }
            pd.DataFrame(summary_data).to_excel(writer, sheet_name='Executive Summary', index=False)
            
            # Sheet 2: By Category
            cat_group = df.groupby('cost_center').agg({
                'total_amount': 'sum',
                'invoice_id': 'count'
            }).reset_index().sort_values('total_amount', ascending=False)
            cat_group.columns = ['Category', 'Total Spend', 'Invoice Count']
            cat_group.to_excel(writer, sheet_name='By Category', index=False)
            
            # Sheet 3: By Merchant
            merch_group = df.groupby('vendor_name').agg({
                'total_amount': 'sum',
                'invoice_id': 'count'
            }).reset_index().sort_values('total_amount', ascending=False)
            merch_group.columns = ['Merchant', 'Total Spend', 'Invoice Count']
            merch_group.to_excel(writer, sheet_name='By Merchant', index=False)
            
            # Sheet 4: Raw Data (Sorted by Date)
            df.sort_values('invoice_date', ascending=False).to_excel(writer, sheet_name='Raw Data', index=False)
            
        return file_path
    finally:
        await conn.close()

async def generate_audit_export():
    conn = await get_db_connection()
    if not conn: return None
    try:
        rows = await conn.fetch("SELECT a.created_at, a.action, a.entity_type, a.entity_id, u.name as user FROM activity_audit_log a LEFT JOIN system_users u ON a.user_id = u.phone ORDER BY a.created_at DESC")
        if not rows: return None
        df = pd.DataFrame([dict(r) for r in rows])
        for col in ['created_at']:
            if col in df.columns: df[col] = df[col].astype(str)
            
        file_path = os.path.join(EXPORT_DIR, f"AuditLogs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx")
        df.to_excel(file_path, index=False)
        return file_path
    finally:
        await conn.close()

async def generate_bot_export():
    conn = await get_db_connection()
    if not conn: return None
    try:
        rows = await conn.fetch("SELECT b.created_at, b.query, b.response, b.intent, u.name as user FROM bot_interactions b LEFT JOIN system_users u ON b.user_id = u.phone ORDER BY b.created_at DESC")
        if not rows: return None
        df = pd.DataFrame([dict(r) for r in rows])
        for col in ['created_at']:
            if col in df.columns: df[col] = df[col].astype(str)

        file_path = os.path.join(EXPORT_DIR, f"BotActivity_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx")
        df.to_excel(file_path, index=False)
        return file_path
    finally:
        await conn.close()

async def generate_merchants_export():
    conn = await get_db_connection()
    if not conn: return None
    try:
        rows = await conn.fetch("""
            SELECT vendor_name, COUNT(*) as invoices, SUM(total_amount) as total_spend, MAX(invoice_date) as last_seen
            FROM invoices
            WHERE vendor_name IS NOT NULL
            GROUP BY vendor_name
            ORDER BY total_spend DESC
        """)
        if not rows: return None
        df = pd.DataFrame([dict(r) for r in rows])
        file_path = os.path.join(EXPORT_DIR, f"Merchants_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx")
        df.to_excel(file_path, index=False)
        return file_path
    finally:
        await conn.close()

async def generate_employees_export():
    conn = await get_db_connection()
    if not conn: return None
    try:
        rows = await conn.fetch("SELECT phone, name, role, is_approved, created_at FROM system_users ORDER BY name")
        if not rows: return None
        df = pd.DataFrame([dict(r) for r in rows])
        for col in ['created_at']:
             if col in df.columns: df[col] = df[col].astype(str)

        file_path = os.path.join(EXPORT_DIR, f"Employees_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx")
        df.to_excel(file_path, index=False)
        return file_path
    finally:
        await conn.close()

async def generate_notifications_export():
    conn = await get_db_connection()
    if not conn: return None
    try:
        rows = await conn.fetch("SELECT created_at, event_type, message, user_id FROM notification_events ORDER BY created_at DESC")
        if not rows: return None
        df = pd.DataFrame([dict(r) for r in rows])
        for col in ['created_at']:
            if col in df.columns: df[col] = df[col].astype(str)
            
        file_path = os.path.join(EXPORT_DIR, f"Notifications_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx")
        df.to_excel(file_path, index=False)
        return file_path
    finally:
        await conn.close()
