from datetime import datetime
from sales_agent.utils.logger import logger
import asyncio

async def update_crm_status(leads_sheet, lead, outcome, deal_value=None):
    """Classifies the deal outcome and updates the Google Sheet record."""
    try:
        update_data = {
            'Status': outcome,
            'Timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        if outcome == "Closed-Won" and deal_value is not None:
            update_data['Deal Value'] = deal_value
        
        await leads_sheet.update_lead_data(lead['Lead Name'], update_data)
        print(f"Deal for {lead['Lead Name']} classified as {outcome} and CRM updated.")
    except Exception as e:
        logger.error(f"Error classifying or updating deal for {lead['Lead Name']}: {e}", exc_info=True)

# Example Usage (for testing purposes, not part of main workflow)
if __name__ == "__main__":
    # This module is intended to be called from main.py after a call ends.
    # For testing, you would need a mock leads_sheet object and a mock lead dictionary.
    pass