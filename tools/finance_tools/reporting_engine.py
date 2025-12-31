import logging
import pandas as pd
from typing import Dict, Any, List
from storage.postgres_repository import get_db_connection
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class ReportingEngine:
    """
    Finance Reporting Engine.
    Generates reproducible period-based reports for Finance teams.
    """

    @staticmethod
    async def get_period_report(start_date: str, end_date: str, group_by: str = 'category') -> Dict[str, Any]:
        conn = await get_db_connection()
        if not conn:
            return {"error": "Database connection failed"}
            
        try:
            # Main query
            query = f"""
                SELECT {group_by}, currency, SUM(total_amount) as total_spend, COUNT(*) as invoice_count
                FROM invoices 
                WHERE invoice_date >= $1 AND invoice_date <= $2 AND status != 'rejected'
                GROUP BY {group_by}, currency
                ORDER BY total_spend DESC
            """
            rows = await conn.fetch(query, datetime.strptime(start_date, "%Y-%m-%d").date(), datetime.strptime(end_date, "%Y-%m-%d").date())
            
            # Anomaly: Sudden Spikes check
            spike_query = """
                SELECT vendor_name, total_amount, invoice_date 
                FROM invoices 
                WHERE invoice_date >= $1 AND invoice_date <= $2 
                AND total_amount > (SELECT AVG(total_amount) * 3 FROM invoices)
            """
            spikes = await conn.fetch(spike_query, datetime.strptime(start_date, "%Y-%m-%d").date(), datetime.strptime(end_date, "%Y-%m-%d").date())

            return {
                "period": {"start": start_date, "end": end_date},
                "summary": [dict(r) for r in rows],
                "risks": {
                    "spikes": [dict(s) for s in spikes]
                }
            }
        except Exception as e:
            logger.error(f"Reporting failed: {e}")
            return {"error": str(e)}
        finally:
            await conn.close()

    @staticmethod
    async def get_budget_status(cost_center: str):
        conn = await get_db_connection()
        if not conn: return None
        
        try:
            budget = await conn.fetchrow("""
                SELECT * FROM budgets 
                WHERE cost_center = $1 AND status = 'active'
                AND period_start <= CURRENT_DATE AND period_end >= CURRENT_DATE
            """, cost_center)
            
            if not budget: return None
            
            # Calculate actual spend from invoices for this cost center
            actual_spend = await conn.fetchval("""
                SELECT SUM(total_amount) FROM invoices 
                WHERE cost_center = $1 AND status != 'rejected'
                AND invoice_date >= $2 AND invoice_date <= $3
            """, cost_center, budget['period_start'], budget['period_end'])
            
            return {
                "allocated": budget['allocated_amount'],
                "spent": float(actual_spend or 0),
                "remaining": float(budget['allocated_amount']) - float(actual_spend or 0),
                "utilization": (float(actual_spend or 0) / float(budget['allocated_amount'])) * 100 if budget['allocated_amount'] > 0 else 0
            }
        finally:
            await conn.close()
