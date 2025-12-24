import pandas as pd
import os
from datetime import datetime

def generate_excel_report(user_phone, expenses):
    if not expenses:
        return None
    
    df = pd.DataFrame(expenses)
    
    # Clean up and select columns
    columns_map = {
        'date': 'Date',
        'merchant': 'Merchant',
        'amount': 'Amount',
        'currency': 'Currency',
        'category': 'Category',
        'payment_method': 'Payment Method',
        'source': 'Source',
        'created_at': 'Saved At'
    }
    
    df = df[list(columns_map.keys())]
    df.rename(columns=columns_map, inplace=True)
    
    # Sort by date
    df.sort_values(by='Date', ascending=False, inplace=True)
    
    # Create filename
    now_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    reports_dir = "reports"
    if not os.path.exists(reports_dir):
        os.makedirs(reports_dir)
        
    file_path = os.path.join(reports_dir, f"report_{user_phone}_{now_str}.xlsx")
    
    try:
        # Create Excel with multiple sheets
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='All Expenses', index=False)
            
            # Summary by category
            cat_summary = df.groupby('Category')['Amount'].sum().reset_index()
            cat_summary.to_excel(writer, sheet_name='ByCategory', index=False)
            
            # Summary by currency
            cur_summary = df.groupby('Currency')['Amount'].sum().reset_index()
            cur_summary.to_excel(writer, sheet_name='ByCurrency', index=False)
            
        print(f"📊 Excel report generated: {file_path}")
        return file_path
    except Exception as e:
        print(f"❌ Error generating Excel: {e}")
        return None
