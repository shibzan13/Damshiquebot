"""
Analytics API Endpoints for Dashboard Charts and Insights
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from storage.postgres_repository import get_db_connection
import os

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

ADMIN_TOKEN_ENV = os.getenv("ADMIN_TOKEN") or os.getenv("ADMIN_API_TOKEN") or "default_secret_token"
FRONTEND_LEGACY_TOKEN = "00b102be503424620ca352a41ef9558e50dc1aa8197042fa65afa28e41154fa7"
VALID_TOKENS = {ADMIN_TOKEN_ENV, FRONTEND_LEGACY_TOKEN, "default_secret_token"}

async def verify_admin(
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
                return incoming
        except Exception as e:
            print(f"Session token validation error (Analytics): {e}")
        finally:
            await conn.close()
    
    # Fallback: Check environment tokens for backward compatibility
    ALLOWED = {
        os.getenv("ADMIN_TOKEN"),
        os.getenv("ADMIN_API_TOKEN"),
        "00b102be503424620ca352a41ef9558e50dc1aa8197042fa65afa28e41154fa7",
        "default_secret_token"
    }
    
    if incoming in ALLOWED:
        return incoming
    
    print(f"DEBUG: Auth DENIED (Analytics) for token: {incoming[:10] if incoming else 'NONE'}...")
    raise HTTPException(
        status_code=403, 
        detail="Access Denied. Invalid or expired session token."
    )

@router.get("/spend-trends")
async def get_spend_trends(
    period: str = "6months",
    interval: str = "month", # week, month, quarter
    token: str = Depends(verify_admin)
):
    """
    Get spend trends for line/area charts with flexible intervals.
    """
    conn = await get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Map frontend interval to PG date_trunc
        pg_interval = "month"
        if interval == "week": pg_interval = "week"
        elif interval == "quarter": pg_interval = "quarter"
        
        # Calculate date range
        if period == "3months": months_back = 3
        elif period == "1year": months_back = 12
        elif period == "all": months_back = 120
        else: months_back = 6
        
        start_date = datetime.now() - timedelta(days=months_back * 30)
        
        query = f"""
            SELECT 
                DATE_TRUNC('{pg_interval}', invoice_date) as interval_date,
                SUM(total_amount) as total_spend,
                COUNT(*) as invoice_count,
                currency
            FROM invoices
            WHERE invoice_date >= $1 AND status != 'rejected'
            GROUP BY DATE_TRUNC('{pg_interval}', invoice_date), currency
            ORDER BY interval_date ASC
        """
        
        rows = await conn.fetch(query, start_date.date())
        
        result = {}
        for row in rows:
            date_key = row['interval_date'].strftime('%Y-%m-%d')
            currency = row['currency'] or 'AED'
            
            if date_key not in result:
                display_name = row['interval_date'].strftime('%b %d') if interval == 'week' else row['interval_date'].strftime('%b %Y')
                if interval == 'quarter':
                    q = (row['interval_date'].month - 1) // 3 + 1
                    display_name = f"Q{q} {row['interval_date'].year}"

                result[date_key] = {
                    'date': date_key,
                    'display_name': display_name,
                    'total': 0,
                    'count': 0,
                    'by_currency': {}
                }
            
            result[date_key]['by_currency'][currency] = float(row['total_spend'])
            result[date_key]['total'] += float(row['total_spend'])
            result[date_key]['count'] += row['invoice_count']
        
        return {
            "period": period,
            "interval": interval,
            "data": list(result.values())
        }
    finally:
        await conn.close()

@router.get("/category-breakdown")
async def get_category_breakdown(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    token: str = Depends(verify_admin)
):
    """
    Get spending breakdown by category for pie/donut charts.
    """
    conn = await get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Default to current month if no dates provided
        if not start_date:
            sd_obj = datetime.now() - timedelta(days=90)
        else:
            sd_obj = datetime.strptime(start_date, '%Y-%m-%d')
            
        if not end_date:
            ed_obj = datetime.now()
        else:
            ed_obj = datetime.strptime(end_date, '%Y-%m-%d')
        
        query = """
            SELECT 
                COALESCE(category, 'Uncategorized') as category,
                SUM(total_amount) as total_spend,
                COUNT(*) as invoice_count,
                ROUND(AVG(total_amount), 2) as avg_amount
            FROM invoices
            WHERE invoice_date >= $1 AND invoice_date <= $2 AND status != 'rejected'
            GROUP BY category
            ORDER BY total_spend DESC
        """
        
        rows = await conn.fetch(query, sd_obj.date() if hasattr(sd_obj, 'date') else sd_obj, ed_obj.date() if hasattr(ed_obj, 'date') else ed_obj)
        
        total = sum(float(row['total_spend']) for row in rows)
        
        return {
            "start_date": start_date,
            "end_date": end_date,
            "total_spend": total,
            "categories": [
                {
                    "name": row['category'],
                    "value": float(row['total_spend']),
                    "count": row['invoice_count'],
                    "avg": float(row['avg_amount']),
                    "percentage": round((float(row['total_spend']) / total * 100), 2) if total > 0 else 0
                }
                for row in rows
            ]
        }
    finally:
        await conn.close()

@router.get("/merchant-comparison")
async def get_merchant_comparison(
    limit: int = 10,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    token: str = Depends(verify_admin)
):
    """
    Get top merchants by spend for bar charts.
    """
    conn = await get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Prepare date objects for asyncpg
        if not start_date:
            sd_obj = datetime.now() - timedelta(days=90)
        else:
            sd_obj = datetime.strptime(start_date, '%Y-%m-%d')
            
        if not end_date:
            ed_obj = datetime.now()
        else:
            ed_obj = datetime.strptime(end_date, '%Y-%m-%d')

        query = """
            SELECT 
                vendor_name,
                SUM(total_amount) as total_spend,
                COUNT(*) as invoice_count,
                MAX(invoice_date) as last_transaction
            FROM invoices
            WHERE invoice_date >= $1 AND invoice_date <= $2 
                AND status != 'rejected'
                AND vendor_name IS NOT NULL
            GROUP BY vendor_name
            ORDER BY total_spend DESC
            LIMIT $3
        """
        
        rows = await conn.fetch(query, sd_obj.date() if hasattr(sd_obj, 'date') else sd_obj, ed_obj.date() if hasattr(ed_obj, 'date') else ed_obj, limit)
        
        return {
            "start_date": start_date,
            "end_date": end_date,
            "merchants": [
                {
                    "name": row['vendor_name'],
                    "total_spend": float(row['total_spend']),
                    "invoice_count": row['invoice_count'],
                    "last_transaction": row['last_transaction'].isoformat() if row['last_transaction'] else None
                }
                for row in rows
            ]
        }
    finally:
        await conn.close()

@router.get("/department-spending")
async def get_department_spending(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    token: str = Depends(verify_admin)
):
    """
    Get spending by department/user for heatmaps.
    """
    conn = await get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Prepare date objects for asyncpg
        if not start_date:
            sd_obj = datetime.now().replace(day=1)
        else:
            sd_obj = datetime.strptime(start_date, '%Y-%m-%d')
            
        if not end_date:
            ed_obj = datetime.now()
        else:
            ed_obj = datetime.strptime(end_date, '%Y-%m-%d')
        
        query = """
            SELECT 
                u.name as employee_name,
                u.role,
                COUNT(i.invoice_id) as invoice_count,
                SUM(i.total_amount) as total_spend,
                AVG(i.total_amount) as avg_spend
            FROM invoices i
            LEFT JOIN system_users u ON i.user_id = u.phone
            WHERE i.invoice_date >= $1 AND i.invoice_date <= $2 AND i.status != 'rejected'
            GROUP BY u.name, u.role
            ORDER BY total_spend DESC
        """
        
        rows = await conn.fetch(query, sd_obj.date() if hasattr(sd_obj, 'date') else sd_obj, ed_obj.date() if hasattr(ed_obj, 'date') else ed_obj)
        
        return {
            "start_date": start_date,
            "end_date": end_date,
            "departments": [
                {
                    "employee": row['employee_name'] or "Unknown",
                    "role": row['role'] or "employee",
                    "invoice_count": row['invoice_count'],
                    "total_spend": float(row['total_spend']),
                    "avg_spend": float(row['avg_spend'])
                }
                for row in rows
            ]
        }
    finally:
        await conn.close()

@router.get("/anomalies")
async def detect_anomalies(
    threshold_multiplier: float = 3.0,
    token: str = Depends(verify_admin)
):
    """
    Detect unusual spending patterns (invoices significantly above average).
    """
    conn = await get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Get average and stddev
        stats_query = """
            SELECT 
                AVG(total_amount) as avg_amount,
                STDDEV(total_amount) as stddev_amount
            FROM invoices
            WHERE status != 'rejected'
                AND invoice_date >= CURRENT_DATE - INTERVAL '90 days'
        """
        
        stats = await conn.fetchrow(stats_query)
        avg = float(stats['avg_amount']) if stats['avg_amount'] else 0
        stddev = float(stats['stddev_amount']) if stats['stddev_amount'] else 0
        
        threshold = avg + (threshold_multiplier * stddev)
        
        # Find anomalies
        anomaly_query = """
            SELECT 
                i.invoice_id,
                i.vendor_name,
                i.total_amount,
                i.invoice_date,
                i.category,
                u.name as user_name
            FROM invoices i
            LEFT JOIN system_users u ON i.user_id = u.phone
            WHERE i.total_amount > $1
                AND i.status != 'rejected'
                AND i.invoice_date >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY i.total_amount DESC
            LIMIT 20
        """
        
        rows = await conn.fetch(anomaly_query, threshold)
        
        return {
            "threshold": threshold,
            "average": avg,
            "stddev": stddev,
            "anomalies": [
                {
                    "invoice_id": str(row['invoice_id']),
                    "vendor": row['vendor_name'],
                    "amount": float(row['total_amount']),
                    "date": row['invoice_date'].isoformat() if row['invoice_date'] else None,
                    "category": row['category'],
                    "user": row['user_name'],
                    "deviation": round((float(row['total_amount']) - avg) / stddev, 2) if stddev > 0 else 0
                }
                for row in rows
            ]
        }
    finally:
        await conn.close()

@router.get("/predictive-spend")
async def get_predictive_spend(
    token: str = Depends(verify_admin)
):
    """
    Predict end-of-month spend based on current trends.
    """
    conn = await get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Get current month spend so far
        current_month_start = datetime.now().replace(day=1)
        current_day = datetime.now().day
        days_in_month = 30  # Simplified
        
        query = """
            SELECT 
                SUM(total_amount) as current_spend,
                COUNT(*) as invoice_count
            FROM invoices
            WHERE invoice_date >= $1 AND status != 'rejected'
        """
        
        row = await conn.fetchrow(query, current_month_start.date())
        
        current_spend = float(row['current_spend']) if row['current_spend'] else 0
        invoice_count = row['invoice_count']
        
        # Simple linear projection
        daily_avg = current_spend / current_day if current_day > 0 else 0
        projected_spend = daily_avg * days_in_month
        
        # Get last month for comparison
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = current_month_start - timedelta(days=1)
        
        last_month_query = """
            SELECT SUM(total_amount) as last_month_spend
            FROM invoices
            WHERE invoice_date >= $1 AND invoice_date <= $2 AND status != 'rejected'
        """
        
        last_row = await conn.fetchrow(last_month_query, last_month_start.date(), last_month_end.date())
        last_month_spend = float(last_row['last_month_spend']) if last_row['last_month_spend'] else 0
        
        return {
            "current_month": current_month_start.strftime('%B %Y'),
            "days_elapsed": current_day,
            "days_remaining": days_in_month - current_day,
            "current_spend": current_spend,
            "projected_spend": projected_spend,
            "last_month_spend": last_month_spend,
            "variance": projected_spend - last_month_spend,
            "variance_percentage": round(((projected_spend - last_month_spend) / last_month_spend * 100), 2) if last_month_spend > 0 else 0,
            "daily_average": daily_avg,
            "invoice_count": invoice_count
        }
    finally:
        await conn.close()
        
@router.get("/budget-vs-actual")
async def get_budget_vs_actual(token: str = Depends(verify_admin)):
    """
    Compare current month spending against budgets.
    """
    conn = await get_db_connection()
    if not conn: raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Get active budgets and current spend for those categories/cost centers
        query = """
            WITH current_spend AS (
                SELECT 
                    COALESCE(category, 'General') as category,
                    SUM(total_amount) as actual_spend
                FROM invoices
                WHERE DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE)
                    AND status != 'rejected'
                GROUP BY category
            )
            SELECT 
                b.cost_center as name,
                b.allocated_amount as budget,
                COALESCE(s.actual_spend, 0) as actual,
                b.currency
            FROM budgets b
            LEFT JOIN current_spend s ON b.cost_center = s.category
            WHERE b.status = 'active'
        """
        rows = await conn.fetch(query)
        
        # Fallback if no budgets are set - create dummy ones based on history for visualization
        if not rows:
            fallback_query = """
                SELECT 
                    COALESCE(category, 'General') as name,
                    SUM(total_amount) as actual,
                    SUM(total_amount) * 1.2 as budget,
                    'AED' as currency
                FROM invoices
                WHERE invoice_date >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY category
            """
            rows = await conn.fetch(fallback_query)

        return [
            {
                "name": r['name'],
                "budget": float(r['budget']),
                "actual": float(r['actual']),
                "remaining": float(r['budget']) - float(r['actual']),
                "percentage": round(float(r['actual']) / float(r['budget']) * 100, 1) if float(r['budget']) > 0 else 0,
                "is_over": float(r['actual']) > float(r['budget'])
            }
            for r in rows
        ]
    finally:
        await conn.close()

@router.get("/top-expenses")
async def get_top_expenses(limit: int = 5, token: str = Depends(verify_admin)):
    conn = await get_db_connection()
    if not conn: return []
    try:
        rows = await conn.fetch("""
            SELECT i.invoice_id, i.vendor_name, i.total_amount, i.invoice_date, i.category, u.name as user_name
            FROM invoices i
            LEFT JOIN system_users u ON i.user_id = u.phone
            WHERE i.status != 'rejected'
            ORDER BY i.total_amount DESC
            LIMIT $1
        """, limit)
        return [dict(r) for r in rows]
    finally:
        await conn.close()

@router.get("/recurring-costs")
async def get_recurring_costs(token: str = Depends(verify_admin)):
    """
    Identifies vendors with frequent, similar-amount transactions.
    """
    conn = await get_db_connection()
    if not conn: return []
    try:
        # Simplified recurring detection: vendors seen in at least 3 distinct months
        rows = await conn.fetch("""
            SELECT 
                vendor_name,
                COUNT(*) as frequency,
                ROUND(AVG(total_amount), 2) as avg_amount,
                COUNT(DISTINCT DATE_TRUNC('month', invoice_date)) as month_count
            FROM invoices
            WHERE vendor_name IS NOT NULL AND status != 'rejected'
            GROUP BY vendor_name
            HAVING COUNT(DISTINCT DATE_TRUNC('month', invoice_date)) >= 2
            ORDER BY avg_amount DESC
        """)
        return [dict(r) for r in rows]
    finally:
        await conn.close()
