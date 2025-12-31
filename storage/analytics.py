from datetime import datetime, timedelta
import calendar

def get_current_month_range():
    """
    Returns the first and last day of the current month as strings.
    Used by export tools for date range filtering.
    """
    now = datetime.now()
    first_day = now.replace(day=1).strftime('%Y-%m-%d')
    last_day = now.replace(day=calendar.monthrange(now.year, now.month)[1]).strftime('%Y-%m-%d')
    return first_day, last_day

# Legacy analytics functions below are deprecated in favor of the new analytics API
# They used SQLite which has been replaced with PostgreSQL
# All analytics are now served via /api/analytics/* endpoints

# async def get_month_summary(user_phone=None, is_admin=False):
#     # Deprecated - use /api/analytics/spend-trends instead
#     pass

# async def get_spend_by_person(is_admin=False):
#     # Deprecated - use /api/analytics/department-spending instead
#     pass

# async def get_spend_by_category(user_phone=None, is_admin=False):
#     # Deprecated - use /api/analytics/category-breakdown instead
#     pass

# async def get_spend_by_merchant(user_phone=None, is_admin=False):
#     # Deprecated - use /api/analytics/merchant-comparison instead
#     pass

# async def get_person_drilldown(name_query, is_admin=False):
#     # Deprecated - use /api/analytics/department-spending instead
#     pass
