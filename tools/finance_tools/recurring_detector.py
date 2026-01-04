import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from storage.postgres_repository import get_db_connection

logger = logging.getLogger(__name__)

class RecurringDetector:
    """
    Analyzes historical expense data to identify recurring patterns (subscriptions).
    """

    @staticmethod
    async def find_potential_recurring(user_id: str, lookback_months: int = 6) -> List[Dict[str, Any]]:
        conn = await get_db_connection()
        if not conn:
            return []
            
        try:
            # Look for vendors with multiple transactions of the same amount
            # We filter out very small amounts as they are less likely to be significant subscriptions
            query = """
                SELECT vendor_name, total_amount, currency, count(*), 
                       array_agg(invoice_date ORDER BY invoice_date DESC) as dates
                FROM invoices
                WHERE user_id = $1 
                  AND status != 'rejected'
                  AND vendor_name IS NOT NULL
                  AND total_amount > 5 -- Filter out peanuts
                  AND invoice_date >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY vendor_name, total_amount, currency
                HAVING count(*) >= 2
                ORDER BY count(*) DESC
            """
            rows = await conn.fetch(query, user_id)
            
            potential = []
            for r in rows:
                dates = r['dates']
                if len(dates) < 2: continue
                
                # Check intervals (average days between)
                intervals = []
                for i in range(len(dates) - 1):
                    diff = (dates[i] - dates[i+1]).days
                    intervals.append(diff)
                
                avg_interval = sum(intervals) / len(intervals)
                
                # Frequencies: Monthly (~28-32 days), Weekly (~7 days), Yearly (~360-370 days)
                frequency = None
                if 25 <= avg_interval <= 35:
                    frequency = "monthly"
                elif 6 <= avg_interval <= 8:
                    frequency = "weekly"
                elif 350 <= avg_interval <= 380:
                    frequency = "yearly"
                
                if frequency:
                    # check if already in subscriptions table
                    existing = await conn.fetchval(
                        "SELECT 1 FROM subscriptions WHERE user_id = $1 AND vendor_name = $2 AND amount = $3",
                        user_id, r['vendor_name'], r['total_amount']
                    )
                    
                    if not existing:
                        potential.append({
                            "vendor_name": r['vendor_name'],
                            "amount": float(r['total_amount']),
                            "currency": r['currency'],
                            "frequency": frequency,
                            "occurrences": r['count'],
                            "last_date": dates[0],
                            "avg_interval": avg_interval
                        })
            
            return potential
            
        except Exception as e:
            logger.error(f"Error in RecurringDetector: {e}")
            return []
        finally:
            await conn.close()

    @staticmethod
    async def record_detected_subscription(user_id: str, data: Dict[str, Any]):
        conn = await get_db_connection()
        if not conn: return
        
        try:
            next_date = data['last_date']
            if data['frequency'] == 'monthly':
                 next_date += timedelta(days=30)
            elif data['frequency'] == 'weekly':
                 next_date += timedelta(days=7)
            elif data['frequency'] == 'yearly':
                 next_date += timedelta(days=365)
                 
            await conn.execute("""
                INSERT INTO subscriptions (user_id, vendor_name, amount, currency, frequency, last_detected_date, next_expected_date, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'detected')
                ON CONFLICT (user_id, vendor_name, amount) DO NOTHING
            """, user_id, data['vendor_name'], data['amount'], data['currency'], data['frequency'], data['last_date'], next_date)
        finally:
            await conn.close()
