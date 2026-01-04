import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import calendar
from storage.postgres_repository import get_db_connection

logger = logging.getLogger(__name__)

class PredictiveAnalytics:
    """
    Predictive analytics for cash flow and budget tracking.
    """

    @staticmethod
    async def get_spend_forecast(user_id: str) -> Dict[str, Any]:
        """
        Predicts total spend for the current month based on current pacing.
        """
        conn = await get_db_connection()
        if not conn: return {}

        try:
            now = datetime.now()
            first_day = now.replace(day=1)
            days_in_month = calendar.monthrange(now.year, now.month)[1]
            day_of_month = now.day

            # 1. Current Month Spend
            current_spend = await conn.fetchval("""
                SELECT SUM(total_amount) FROM invoices 
                WHERE user_id = $1 AND status != 'rejected'
                AND invoice_date >= $2
            """, user_id, first_day.date()) or 0

            # 2. Daily pacing
            pacing = float(current_spend) / day_of_month if day_of_month > 0 else 0
            projected_spend = pacing * days_in_month

            # 3. Check Budgets
            budget = await conn.fetchrow("""
                SELECT allocated_amount FROM budgets 
                WHERE period_start <= $1 AND period_end >= $1
                ORDER BY created_at DESC LIMIT 1
            """, now.date())
            # Note: The original budgets table might not be user-specific in the 01 migration, 
            # or it might be cost-center based. We'll use the most relevant one.

            budget_amount = float(budget['allocated_amount']) if budget else 1000.0 # Default fallback
            
            is_on_track = projected_spend <= budget_amount
            utilization = (float(current_spend) / budget_amount) * 100 if budget_amount > 0 else 0

            return {
                "current_spend": float(current_spend),
                "projected_spend": round(projected_spend, 2),
                "budget_amount": budget_amount,
                "utilization_percent": round(utilization, 2),
                "is_on_track": is_on_track,
                "days_remaining": days_in_month - day_of_month,
                "warning_needed": (not is_on_track) and (day_of_month >= 15) # Warn if over track by the 15th
            }
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {}
        finally:
            await conn.close()

    @staticmethod
    async def get_next_month_projection(user_id: str) -> Dict[str, Any]:
        """
        Predicts next month's cash flow based on 6-month average.
        """
        conn = await get_db_connection()
        if not conn: return {}

        try:
            # Get average monthly spend over last 6 months
            avg_spend = await conn.fetchval("""
                SELECT AVG(monthly_total) FROM (
                    SELECT SUM(total_amount) as monthly_total
                    FROM invoices
                    WHERE user_id = $1 AND status != 'rejected'
                    AND invoice_date >= CURRENT_DATE - INTERVAL '6 months'
                    GROUP BY DATE_TRUNC('month', invoice_date)
                ) as monthly_averages
            """, user_id) or 0

            # Get known subscriptions for next month
            subscriptions_total = await conn.fetchval("""
                SELECT SUM(amount) FROM subscriptions
                WHERE user_id = $1 AND status = 'active'
            """, user_id) or 0

            return {
                "estimated_next_month": round(float(avg_spend), 2),
                "fixed_costs_next_month": round(float(subscriptions_total), 2),
                "total_forecast": round(float(avg_spend) + float(subscriptions_total), 2)
            }
        except Exception as e:
            logger.error(f"Next month projection error: {e}")
            return {}
        finally:
            await conn.close()
