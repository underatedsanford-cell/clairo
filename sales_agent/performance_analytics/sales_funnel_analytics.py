from sales_agent.utils.logger import logger
from sales_agent.utils.google_sheets import update_sheet

async def track_funnel_performance(leads_data):
    logger.info("Tracking sales funnel performance.")

    total_leads = len(leads_data)
    if total_leads == 0:
        logger.warning("No leads data to analyze.")
        return

    # Calculate key metrics
    qualified_leads = sum(1 for lead in leads_data if lead.get('status') == 'Qualified')
    outreach_sent = sum(1 for lead in leads_data if lead.get('outreach_status') == 'Sent')
    calls_booked = sum(1 for lead in leads_data if lead.get('booking_status') == 'Booked')

    conversion_rates = {
        "lead_to_qualified": (qualified_leads / total_leads) * 100 if total_leads > 0 else 0,
        "qualified_to_outreach": (outreach_sent / qualified_leads) * 100 if qualified_leads > 0 else 0,
        "outreach_to_booked": (calls_booked / outreach_sent) * 100 if outreach_sent > 0 else 0,
    }

    # Log and store the metrics
    logger.info(f"Funnel Metrics: {conversion_rates}")

    # Example: Update a Google Sheet with the latest metrics
    try:
        sheet_name = "Performance Analytics"
        range_name = "A1"
        values = [
            ["Metric", "Value"],
            ["Total Leads", total_leads],
            ["Qualified Leads", qualified_leads],
            ["Outreach Sent", outreach_sent],
            ["Calls Booked", calls_booked],
            ["Lead to Qualified Rate (%)", conversion_rates["lead_to_qualified"]],
            ["Qualified to Outreach Rate (%)", conversion_rates["qualified_to_outreach"]],
            ["Outreach to Booked Rate (%)", conversion_rates["outreach_to_booked"]],
        ]
        await update_sheet(sheet_name, range_name, values)
        logger.info("Performance metrics updated in Google Sheets.")
    except Exception as e:
        logger.error(f"Failed to update performance metrics in Google Sheets: {e}")