import asyncio
from sales_agent.leads.google_sheets import GoogleSheet
from sales_agent.config import GOOGLE_SHEET_ID, GOOGLE_SHEETS_CREDENTIALS_PATH

async def main():
    sheets = GoogleSheet(sheet_id=GOOGLE_SHEET_ID, credentials_path=GOOGLE_SHEETS_CREDENTIALS_PATH)
    leads = await sheets.read_leads()
    if leads:
        print("Found the following leads:")
        for lead in leads:
            print(lead)
    else:
        print("No leads found.")

if __name__ == "__main__":
    asyncio.run(main())