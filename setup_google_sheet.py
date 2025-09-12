from dotenv import load_dotenv
load_dotenv()

import gspread
from oauth2client.service_account import ServiceAccountCredentials
import os
from sales_agent.config import GOOGLE_SHEETS_CREDENTIALS_PATH, GOOGLE_SHEET_ID
from sales_agent.utils.error_logger import log_error_to_sheet
import asyncio

def setup_google_sheet():
    """Sets up the Google Sheet with required columns."""
    try:
        # Authenticate
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_name(GOOGLE_SHEETS_CREDENTIALS_PATH, scope)
        client = gspread.authorize(creds)
        
        # Create new sheet
        try:
            sheet = client.open_by_key(GOOGLE_SHEET_ID)
            print(f"Opened existing sheet: {sheet.title} with ID: {sheet.id}")
        except Exception as e:
            print(f"Error opening sheet with ID {GOOGLE_SHEET_ID}: {e}")
            asyncio.run(log_error_to_sheet(f"Error opening Google Sheet with ID {GOOGLE_SHEET_ID}", str(e)))
            return False
        
        # Create or update 'Leads' worksheet
        try:
            worksheet = sheet.worksheet("Leads")
        except:
            worksheet = sheet.add_worksheet(title="Leads", rows="100", cols="20")
        
        # Set headers
        headers = [
            "Lead Name", "Company", "Role", "Source URL",
            "Work Email", "Direct Phone",
            "SMS Reply", "Email Reply",
            "Status", "Timestamp", "Deal Value"
        ]
        worksheet.update("A1:K1", [headers])
        
        # Create Logs worksheet if it doesn't exist
        try:
            sheet.worksheet("Logs")
        except:
            logs = sheet.add_worksheet(title="Logs", rows="100", cols="3")
            logs.update("A1:C1", [["Timestamp", "Error Message"]])
        
        print(f"Successfully set up Google Sheet: {sheet.url}")
        return True
    except Exception as e:
        print(f"Error setting up Google Sheet: {str(e)}")
        asyncio.run(log_error_to_sheet("Error setting up Google Sheet", str(e)))
        return False

if __name__ == "__main__":
    setup_google_sheet()