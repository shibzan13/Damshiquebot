from typing import Dict, Any, List, Optional
import logging
from storage.postgres_repository import get_db_connection, sanitize_file_url
from tools.finance_tools.reporting_engine import ReportingEngine
import asyncpg
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class QueryEngine:
    """
    Step 4: Deterministic Query Engine.
    Translates structured intent into database queries.
    Applies user permissions.
    """
    
    @staticmethod
    async def execute_query(user_id: str, role: str, intent: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        conn = await get_db_connection()
        if not conn:
            return {"error": "Database connection failed"}

        try:
            if intent == "expense_summary":
                return await QueryEngine._handle_expense_summary(conn, user_id, role, entities)
            elif intent == "invoice_search":
                return await QueryEngine._handle_invoice_search(conn, user_id, role, entities)
            elif intent == "invoice_detail":
                return await QueryEngine._handle_invoice_detail(conn, user_id, role, entities)
            elif intent == "invoice_status":
                return await QueryEngine._handle_invoice_status(conn, user_id, role, entities)
            elif intent == "finance_report" and role == "admin":
                return await ReportingEngine.get_period_report(
                    entities.get("start_date", "2025-01-01"), 
                    entities.get("end_date", "2025-12-31")
                )
            elif intent == "budget_query":
                return await ReportingEngine.get_budget_status(entities.get("category", "General"))
            elif intent == "recurring_query":
                from tools.finance_tools.recurring_detector import RecurringDetector
                potential = await RecurringDetector.find_potential_recurring(user_id)
                # Also get confirmed ones
                rows = await conn.fetch("SELECT * FROM subscriptions WHERE user_id = $1", user_id)
                return {"confirmed": [dict(r) for r in rows], "potential": potential, "query_meta": {"intent": "recurring_query"}}
            elif intent == "predictive_query":
                from tools.finance_tools.predictive_analytics import PredictiveAnalytics
                forecast = await PredictiveAnalytics.get_spend_forecast(user_id)
                next_month = await PredictiveAnalytics.get_next_month_projection(user_id)
                return {"forecast": forecast, "next_month": next_month, "query_meta": {"intent": "predictive_query"}}
            elif intent == "finance_export":
                from tools.export_tools import generate_custom_export
                # Map entities to date range if possible
                target_user_id = user_id if role != "admin" else None
                file_path = await generate_custom_export(user_id=target_user_id) 
                return {"export_file": file_path, "query_meta": {"intent": "finance_export"}}
            elif intent == "clear_data":
                if role != "admin":
                    await conn.execute("DELETE FROM invoices WHERE user_id = $1", user_id)
                else:
                    await conn.execute("DELETE FROM invoices") # Master clear for admin
                return {"results": [], "query_meta": {"intent": "clear_data", "success": True}}
            elif intent == "finance_scenario":
                return await QueryEngine._handle_finance_scenario(conn, user_id, role, entities)
            elif intent == "custom_report":
                return await QueryEngine._handle_custom_report(conn, user_id, role, entities)
            elif intent == "chat":
                 # Pass through to response generator for pure conversation
                 return {"results": [], "query_meta": {"intent": "chat"}}
            elif intent == "semantic_search":
                return await QueryEngine._handle_semantic_search(conn, user_id, role, entities)
            else:
                return {
                    "error": "Unknown intent or insufficient permissions",
                    "query_meta": {"intent": intent}
                }
        except Exception as e:
            logger.error(f"Query execution error: {e}")
            return {"error": str(e), "query_meta": {"intent": intent}}
        finally:
            await conn.close()

    @staticmethod
    async def _handle_expense_summary(conn, user_id, role, entities):
        metric = entities.get("metric", "total")
        group_by = entities.get("group_by", "category")
        
        # Mapping group_by to actual columns
        col_map = {"vendor": "vendor_name", "category": "category", "month": "TO_CHAR(invoice_date, 'YYYY-MM')", "department": "cost_center"}
        group_col = col_map.get(group_by, "category")

        query = f"SELECT {group_col} as label, currency, SUM(total_amount) as total, COUNT(*) as count FROM invoices WHERE status != 'rejected'"
        params = []
        param_idx = 1
        
        if role != "admin":
            query += f" AND user_id = ${param_idx}"
            params.append(user_id)
            param_idx += 1
            
        date_range = entities.get("date_range")
        if date_range == "this_month":
            start_date = datetime.now().replace(day=1).date()
            query += f" AND invoice_date >= ${param_idx}"
            params.append(start_date)
            param_idx += 1
        elif date_range == "last_month":
            today = datetime.now().date()
            first = today.replace(day=1)
            last_month_end = first - timedelta(days=1)
            last_month_start = last_month_end.replace(day=1)
            query += f" AND invoice_date >= ${param_idx} AND invoice_date <= ${param_idx+1}"
            params.extend([last_month_start, last_month_end])
            param_idx += 2
            
        query += f" GROUP BY {group_col}, currency"
        
        if metric == "highest":
            query += " ORDER BY total DESC LIMIT 1"
        elif metric == "lowest":
            query += " ORDER BY total ASC LIMIT 1"
        else:
            query += " ORDER BY total DESC"

        rows = await conn.fetch(query, *params)
        return {"results": [dict(r) for r in rows], "query_meta": {"intent": "expense_summary", "filters": entities}}

    @staticmethod
    async def _handle_invoice_search(conn, user_id, role, entities):
        query = "SELECT i.invoice_id, i.vendor_name, i.total_amount, i.currency, i.invoice_date, i.status, i.file_url, u.name as user_name FROM invoices i LEFT JOIN system_users u ON i.user_id = u.phone WHERE 1=1"
        params = []
        param_idx = 1
        
        # Permissions
        if role != "admin":
            query += f" AND user_id = ${param_idx}"
            params.append(user_id)
            param_idx += 1
            
        # Filters
        vendor = entities.get("vendor")
        if vendor:
            query += f" AND vendor_name ILIKE ${param_idx}"
            params.append(f"%{vendor}%")
            param_idx += 1
            
        amount_filter = entities.get("amount_filter")
        if amount_filter:
            if amount_filter.startswith(">"):
                query += f" AND total_amount > ${param_idx}"
                params.append(float(amount_filter[1:]))
            elif amount_filter.startswith("<"):
                query += f" AND total_amount < ${param_idx}"
                params.append(float(amount_filter[1:]))
            else:
                query += f" AND total_amount = ${param_idx}"
                params.append(float(amount_filter))
            param_idx += 1

        status = entities.get("status")
        if status:
            query += f" AND status = ${param_idx}"
            params.append(status)
            param_idx += 1

        query += " ORDER BY invoice_date DESC LIMIT 5"
        rows = await conn.fetch(query, *params)
        results = []
        for r in rows:
            d = dict(r)
            d["file_url"] = sanitize_file_url(d.get("file_url"))
            results.append(d)
        return {"results": results, "query_meta": {"intent": "invoice_search", "filters": entities}}

    @staticmethod
    async def _handle_invoice_detail(conn, user_id, role, entities):
        # We need an ID. 
        invoice_id = entities.get("invoice_id")
        if not invoice_id:
            return {"error": "Specific invoice not identified. Which one are you referring to?"}
            
        # Check permissions first
        invoice = await conn.fetchrow("SELECT * FROM invoices WHERE invoice_id = $1", invoice_id)
        if not invoice:
            return {"error": "Invoice not found"}
            
        if role != "admin" and invoice['user_id'] != user_id:
            return {"error": "You do not have permission to view this invoice"}
            
        items = await conn.fetch("SELECT * FROM invoice_line_items WHERE invoice_id = $1", invoice_id)
        
        d = dict(invoice)
        d["file_url"] = sanitize_file_url(d.get("file_url"))
        return {
            "summary": d,
            "line_items": [dict(i) for i in items],
            "query_meta": {"intent": "invoice_detail", "invoice_id": invoice_id}
        }

    @staticmethod
    async def _handle_invoice_status(conn, user_id, role, entities):
        # Similar to search but focused on status fields
        # Not implemented in detail here for brevity, but follows same pattern
        return await QueryEngine._handle_invoice_search(conn, user_id, role, entities)

    @staticmethod
    async def _handle_semantic_search(conn, user_id, role, entities):
        """
        Semantic search using vector embeddings.
        Finds invoices by natural language description.
        """
        search_query = entities.get("search_query", "")
        if not search_query:
            return {"error": "No search query provided", "query_meta": {"intent": "semantic_search"}}
        
        # Generate embedding for the search query
        from tools.document_tools.extraction_tools import generate_embedding
        query_embedding = await generate_embedding(search_query)
        
        if not query_embedding:
            # Fallback to regular text search
            logger.warning("Embedding generation failed, falling back to text search")
            entities["vendor"] = search_query
            return await QueryEngine._handle_invoice_search(conn, user_id, role, entities)
        
        # Vector similarity search using cosine distance
        # Lower distance = more similar
        query = """
            SELECT i.invoice_id, i.vendor_name, i.total_amount, i.currency, 
                   i.invoice_date, i.status, i.file_url, i.raw_text, u.name as user_name,
                   (i.embedding <=> $1::vector) as distance
            FROM invoices i
            LEFT JOIN system_users u ON i.user_id = u.phone
            WHERE i.embedding IS NOT NULL
        """
        params = [str(query_embedding)]
        param_idx = 2
        
        # Apply permissions
        if role != "admin":
            query += f" AND i.user_id = ${param_idx}"
            params.append(user_id)
            param_idx += 1
        
        # Order by similarity and limit results
        query += " ORDER BY distance ASC LIMIT 10"
        
        try:
            rows = await conn.fetch(query, *params)
            results = []
            for i, r in enumerate(rows):
                d = dict(r)
                d["file_url"] = sanitize_file_url(d.get("file_url"))
                # Include similarity score (convert distance to similarity percentage)
                d["similarity"] = max(0, min(100, (1 - d["distance"]) * 100))
                
                # Only include full raw_text for the top 3 results to save tokens
                if i >= 3:
                     d["raw_text"] = d.get("raw_text", "")[:200] + "..." if d.get("raw_text") else None
                
                results.append(d)
            
            return {
                "results": results,
                "query_meta": {
                    "intent": "semantic_search",
                    "search_query": search_query,
                    "method": "vector_similarity"
                }
            }
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            # Fallback to text search
            entities["vendor"] = search_query
            return await QueryEngine._handle_invoice_search(conn, user_id, role, entities)

    @staticmethod
    async def _handle_finance_scenario(conn, user_id, role, entities):
        from tools.finance_tools.reporting_engine import ReportingEngine
        params = entities.get("scenario_params", {})
        target_user_id = user_id if role != "admin" else None
        results = await ReportingEngine.get_scenario_analysis(target_user_id, params)
        return {**results, "query_meta": {"intent": "finance_scenario"}}

    @staticmethod
    async def _handle_custom_report(conn, user_id, role, entities):
        from tools.finance_tools.reporting_engine import ReportingEngine
        group_by = entities.get("group_by", "cost_center")
        target_user_id = user_id if role != "admin" else None
        results = await ReportingEngine.get_custom_report(target_user_id, group_by)
        return {**results, "query_meta": {"intent": "custom_report"}}
