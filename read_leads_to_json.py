import asyncio
from sales_agent.leads.google_sheets import GoogleSheet
from sales_agent.config import GOOGLE_SHEET_ID, GOOGLE_SHEETS_CREDENTIALS_PATH
import json

async def main():
    sheets = GoogleSheet(sheet_id=GOOGLE_SHEET_ID, credentials_path=GOOGLE_SHEETS_CREDENTIALS_PATH)
    leads = await sheets.read_leads()
    if leads:
        print(f"Found {len(leads)} leads.")
        with open('output.json', 'w') as f:
            json.dump(leads, f, indent=4)
    else:
        print("No leads found.")

if __name__ == "__main__":
    asyncio.run(main())