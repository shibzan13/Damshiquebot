import os
import logging
from googleapiclient.discovery import build
from google.oauth2 import service_account
from storage.postgres_repository import get_all_invoices

logger = logging.getLogger(__name__)

# Config
SPREADSHEET_ID = os.getenv("GOOGLE_SHEET_ID")
RANGE_NAME = 'Invoices!A:H'

def get_sheets_service():
    creds_path = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not creds_path or not os.path.exists(creds_path):
        logger.error("Google Service Account JSON not found")
        return None
        
    creds = service_account.Credentials.from_service_account_file(
        creds_path, scopes=['https://www.googleapis.com/auth/spreadsheets']
    )
    return build('sheets', 'v4', credentials=creds)

async def sync_invoices_to_sheet():
    """
    Step 5: Sheet Sync Isolation.
    Reads ONLY from the invoices summary table.
    """
    service = get_sheets_service()
    if not service or not SPREADSHEET_ID:
        return
        
    # Fetch summary data only
    invoices = await get_all_invoices(limit=100)
    
    if not invoices:
        return

    # Prepare rows (Summary only, no line items)
    # Header format: Date, Vendor, Currency, Subtotal, Tax, Total, Status, File URL
    values = []
    for inv in invoices:
        values.append([
            inv['invoice_date'].isoformat() if inv['invoice_date'] else '',
            inv['vendor_name'],
            inv['currency'],
            float(inv['subtotal'] or 0),
            float(inv['tax_amount'] or 0),
            float(inv['total_amount'] or 0),
            inv['status'],
            inv['file_url'] or ''
        ])

    try:
        body = {'values': values}
        service.spreadsheets().values().update(
            spreadsheetId=SPREADSHEET_ID,
            range=RANGE_NAME,
            valueInputOption='RAW',
            body=body
        ).execute()
        logger.info(f"Successfully synced {len(values)} invoices to Google Sheets")
    except Exception as e:
        logger.error(f"Google Sheets sync failed: {e}")

async def append_invoice_to_sheet(invoice_data: dict):
    """
    Appends a single invoice row to the sheet.
    """
    service = get_sheets_service()
    if not service or not SPREADSHEET_ID:
        return
        
    row = [
        invoice_data.get('invoice_date', ''),
        invoice_data.get('vendor_name', ''),
        invoice_data.get('currency', 'AED'),
        float(invoice_data.get('subtotal') or 0),
        float(invoice_data.get('tax_amount') or 0),
        float(invoice_data.get('total_amount') or 0),
        invoice_data.get('status', 'pending'),
        invoice_data.get('file_url', '')
    ]
    
    try:
        body = {'values': [row]}
        service.spreadsheets().values().append(
            spreadsheetId=SPREADSHEET_ID,
            range=RANGE_NAME,
            valueInputOption='RAW',
            body=body
        ).execute()
        logger.info(f"Appended invoice to sheet: {invoice_data.get('vendor_name')}")
    except Exception as e:
        logger.error(f"Failed to append to sheet: {e}")
