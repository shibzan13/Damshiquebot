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

async def verify_admin(x_api_token: str = Header(None, alias="X-API-Token"), token: Optional[str] = None):
    final_token = x_api_token or token
    if not final_token or final_token not in VALID_TOKENS:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return final_token

@router.get("/spend-trends")
async def get_spend_trends(
    period: str = "6months",
    token: str = Depends(verify_admin)
):
    """
    Get monthly spend trends for line/area charts.
    Period: 3months, 6months, 1year, all
    """
    conn = await get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Calculate date range
        if period == "3months":
            months_back = 3
        elif period == "1year":
            months_back = 12
        elif period == "all":
            months_back = 120  # 10 years
        else:  # default 6months
            months_back = 6
        
        start_date = datetime.now() - timedelta(days=months_back * 30)
        
        query = """
            SELECT 
                DATE_TRUNC('month', invoice_date) as month,
                SUM(total_amount) as total_spend,
                COUNT(*) as invoice_count,
                currency
            FROM invoices
            WHERE invoice_date >= $1 AND status != 'rejected'
            GROUP BY DATE_TRUNC('month', invoice_date), currency
            ORDER BY month ASC
        """
        
        rows = await conn.fetch(query, start_date.date())
        
        # Format for frontend
        result = {}
        for row in rows:
            month_key = row['month'].strftime('%Y-%m')
            currency = row['currency'] or 'AED'
            
            if month_key not in result:
                result[month_key] = {
                    'month': month_key,
                    'month_name': row['month'].strftime('%b %Y'),
                    'total': 0,
                    'count': 0,
                    'by_currency': {}
                }
            
            result[month_key]['by_currency'][currency] = float(row['total_spend'])
            result[month_key]['total'] += float(row['total_spend'])
            result[month_key]['count'] += row['invoice_count']
        
        return {
            "period": period,
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
            start_date = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
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
        
        rows = await conn.fetch(query, start_date, end_date)
        
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
        if not start_date:
            start_date = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
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
        
        rows = await conn.fetch(query, start_date, end_date, limit)
        
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
        if not start_date:
            start_date = datetime.now().replace(day=1).strftime('%Y-%m-%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
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
        
        rows = await conn.fetch(query, start_date, end_date)
        
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
