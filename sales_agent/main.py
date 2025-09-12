from dotenv import load_dotenv




import os
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))

import asyncio
import os
import sys

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sales_agent.leads.google_sheets import GoogleSheet
from sales_agent.leads.enrichment import enrich_lead_data
from sales_agent.outreach.gpt_script_generation import generate_outreach_script
from sales_agent.outreach.gmail_smtp import send_email
from sales_agent.outreach.twilio_sms import send_sms
from sales_agent.calls.call_booking import send_booking_link
from sales_agent.deal_crm_update import update_crm_status
from sales_agent.utils.logger import setup_logging
from sales_agent.utils.error_logger import log_error_and_alert
from sales_agent.config import GOOGLE_SHEET_ID, GOOGLE_SHEETS_CREDENTIALS_PATH, CALENDLY_TIDYCAL_LINK
from sales_agent.shared_state import save_state

logger = setup_logging()

async def process_single_lead(google_sheet, lead):
    logger.info(f"Processing lead: {lead['Lead Name']}")
    # 1. Lead Enrichment
    enriched_data = enrich_lead_data(lead)
    lead.update(enriched_data)

    # 2. Personalized Outreach
    outreach_script = await generate_outreach_script(lead['Lead Name'], lead['Company'], lead['Role'])
    if outreach_script:
        logger.info(f"Generated outreach script for {lead['Lead Name']}")
        # Determine channel and send message
        if lead.get('Direct Phone'):
            await send_sms(lead['Direct Phone'], outreach_script)
            lead['Outreach Status'] = 'SMS Sent'
            lead['Reply Channel'] = 'SMS'
            await google_sheet.update_lead_score(lead['Lead Name'], 1) # +1 for clear pain point/need
        elif lead.get('Work Email'):
            subject = f"A quick question for {lead['Lead Name']} at {lead['Company']}"
            await send_email(lead['Work Email'], subject, outreach_script, lead['Lead Name'], lead['Company'])
            lead['Outreach Status'] = 'Email Sent'
            lead['Reply Channel'] = 'Email'
            await google_sheet.update_lead_score(lead['Lead Name'], 1) # +1 for clear pain point/need
            return True # Indicate successful outreach
        else:
            logger.warning(f"No contact information for {lead['Lead Name']}. Skipping outreach.")
            lead['Outreach Status'] = 'Skipped - No Contact Info'
            await google_sheet.update_lead_score(lead['Lead Name'], -1) # -1 for generic company
            return False # Indicate failed outreach
    else:
        logger.error(f"Script generation failed for {lead['Lead Name']}")
        lead['Outreach Status'] = 'Skipped - Script Gen Failed'
        return False # Indicate failed outreach

    # 3. Follow-Up & Qualification
    # This part would typically involve checking for replies after a delay.
    # For this simplified example, we'll assume a positive reply for demonstration.
    # In a real scenario, you'd have a mechanism to update 'SMS Reply' or 'Email Reply' columns.
    if lead.get('Outreach Status') in ['SMS Sent', 'Email Sent']:
        # Simulate waiting 48 hours and checking for reply
        # For now, we'll just check if a reply status is present (simulating a positive reply)
        if lead.get('SMS Reply') or lead.get('Email Reply'):
            logger.info(f"Lead {lead['Lead Name']} has a positive reply, sending booking link.")
            await send_booking_link(google_sheet, lead, lead['Reply Channel'] if 'Reply Channel' in lead else 'email')
            lead['Status'] = 'Booking Link Sent'
            return 'positive_reply' # Indicate positive reply
        else:
            logger.info(f"Lead {lead['Lead Name']} not in outreach sent status, skipping follow-up check.")
            # In a real scenario, generate and send a 1-sentence follow-up message
            # For now, we'll just mark as no reply
            lead['Status'] = 'No Reply - Follow-up Sent (Simulated)'
            return 'no_reply' # Indicate no reply
    else:
        logger.info(f"Lead {lead['Lead Name']} not in outreach sent status, skipping follow-up check.")
        return 'skipped' # Indicate skipped follow-up

    # 4. Deal Confirmation & CRM Update (Simplified)
    # This would happen after a call, but for demonstration, we'll update based on booking link sent
    if lead.get('Status') == 'Booking Link Sent':
        await update_crm_status(google_sheet, lead, 'Closed-Won', deal_value=1000) # Simulate a won deal
        return 'call_booked' # Indicate call booked
    else:
        await update_crm_status(google_sheet, lead, 'Closed-Lost') # Simulate a lost deal
        return 'no_call_booked' # Indicate no call booked

    logger.info(f"Finished processing lead: {lead['Lead Name']}. Final Status: {lead.get('Status')}")
    return 'deal_closed' if lead.get('Status') == 'Closed-Won' else 'deal_lost'

async def run_sales_agent(num_leads: int = None, target_audience: str = None):
    logger.info("Sales agent started...")
    google_sheet = GoogleSheet(GOOGLE_SHEET_ID, GOOGLE_SHEETS_CREDENTIALS_PATH)

    # Initialize metrics for daily report
    from sales_agent.shared_state import sales_agent_status
    sales_agent_status["last_update"] = "Sales agent started"
    sales_agent_status["new_leads_added"] = 0
    sales_agent_status["outreach_sent_count"] = 0
    sales_agent_status["replies_received_count"] = 0
    sales_agent_status["calls_booked_count"] = 0
    sales_agent_status["deals_closed_count"] = 0
    sales_agent_status["total_pipeline_value"] = 0
    sales_agent_status["follow_ups_scheduled_count"] = 0
    sales_agent_status["booked_calls_list"] = []

    # Morning: Review top 10 hottest leads
    logger.info("Reviewing top 10 hottest leads...")
    top_leads = await google_sheet.read_leads_sorted_by_score(num_leads=10)
    if top_leads:
        logger.info("Top 10 Hottest Leads:")
        for i, lead in enumerate(top_leads):
            logger.info(f"{i+1}. {lead.get('Lead Name')} (Score: {lead.get('Lead Score', 0)})")
    else:
        logger.info("No leads found or scored yet.")

    leads_data = await google_sheet.read_leads()
    sales_agent_status["new_leads_added"] = len(leads_data)
    sales_agent_status["last_update"] = f"Found {sales_agent_status['new_leads_added']} businesses in the pipeline niche."
    logger.info(f"✅ Found {sales_agent_status['new_leads_added']} businesses in the pipeline niche. Lead list updated in the tracker.")

    # Midday: Send new outreach (5–10 leads)
    logger.info("Sending new outreach to 5-10 leads...")
    leads_for_outreach = leads_data[:min(len(leads_data), 10)] # Take up to 10 leads for new outreach
    tasks = []
    for i, lead in enumerate(leads_for_outreach):
        logger.info(f"\n--- Preparing to process Lead {i+1}/{len(leads_for_outreach)}: {lead['Lead Name']} ---")
        tasks.append(process_single_lead(google_sheet, lead))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    for i, (lead, result) in enumerate(zip(leads_for_outreach, results)):
        logger.info(f"\n--- Processing result for Lead {i+1}/{len(leads_for_outreach)}: {lead['Lead Name']} ---")
        if isinstance(result, Exception):
            logger.error(f"Error processing lead {lead['Lead Name']}: {result}")
            await log_error_and_alert(f"Error processing lead {lead['Lead Name']}", str(result))
            lead['Status'] = 'Error'
        else:
            outreach_successful = result
            if outreach_successful:
                sales_agent_status["outreach_sent_count"] += 1
                sales_agent_status["last_update"] = f"Sent outreach to {sales_agent_status['outreach_sent_count']} leads."
        # Update the Google Sheet after processing each lead, regardless of success or failure
        await google_sheet.update_lead_data(lead['Lead Name'], lead)
        logger.info(f"--- Finished processing for Lead {i+1}/{len(leads_for_outreach)}: {lead['Lead Name']} ---")
        logger.info(f"Details for {lead['Lead Name']} can be found in the logs (sales_agent/utils/logger.py) and Google Sheet (sales_agent/leads/google_sheets.py).")
    logger.info(f"📤 Sent outreach emails to {sales_agent_status['outreach_sent_count']} of {len(leads_for_outreach)} leads.")
    logger.info("Outreach messages logged in the tracker.")

 # Assuming lead dict contains all updated fields

    # End of day: Follow up + log outcomes
    logger.info("Performing end-of-day follow-ups and logging outcomes...")
    # This part would involve checking all leads for replies and sending follow-ups
    # For now, we'll re-process all leads to ensure status updates are logged
    all_leads_after_outreach = await google_sheet.read_leads() # Re-read to get latest status
    positive_replies = 0
    no_responses = 0
    bounced_emails = 0

    follow_up_tasks = []
    for i, lead in enumerate(all_leads_after_outreach):
        logger.info(f"\n--- Preparing follow-up processing for Lead {i+1}/{len(all_leads_after_outreach)}: {lead['Lead Name']} ---")
        follow_up_tasks.append(process_single_lead(google_sheet, lead))

    follow_up_results = await asyncio.gather(*follow_up_tasks, return_exceptions=True)

    for i, (lead, result) in enumerate(zip(all_leads_after_outreach, follow_up_results)):
        logger.info(f"\n--- Processing follow-up result for Lead {i+1}/{len(all_leads_after_outreach)}: {lead['Lead Name']} ---")
        if isinstance(result, Exception):
            logger.error(f"Error processing lead {lead['Lead Name']} during follow-up: {result}")
            await log_error_and_alert(f"Error processing lead {lead['Lead Name']} during follow-up", str(result))
            lead['Status'] = 'Error'
        else:
            follow_up_status = result
            if follow_up_status == 'positive_reply':
                sales_agent_status["replies_received_count"] += 1
                sales_agent_status["last_update"] = f"Received positive reply from {lead['Lead Name']}."
            elif follow_up_status == 'no_reply':
                sales_agent_status["follow_ups_scheduled_count"] += 1 # Assuming a follow-up was sent
                sales_agent_status["last_update"] = f"Sent follow-up to {lead['Lead Name']}."
            
            if follow_up_status == 'call_booked':
                sales_agent_status["calls_booked_count"] += 1
                sales_agent_status["booked_calls_list"].append(f"{lead.get('Lead Name')}, {lead.get('Company')}")

        await google_sheet.update_lead_data(lead['Lead Name'], lead)
        logger.info(f"--- Finished follow-up processing for Lead {i+1}/{len(all_leads_after_outreach)}: {lead['Lead Name']} ---")
        logger.info(f"Details for {lead['Lead Name']} can be found in the logs (sales_agent/utils/logger.py) and Google Sheet (sales_agent/leads/google_sheets.py).")

        if lead.get('Status') == 'Closed-Won':
            sales_agent_status["deals_closed_count"] += 1
            sales_agent_status["total_pipeline_value"] += 1200 # Assuming a deal value of $1200 for now
            sales_agent_status["last_update"] = f"Closed deal with {lead['Lead Name']}."

    logger.info(f"🔄 Followed up with {sales_agent_status['follow_ups_scheduled_count']} unresponsive leads.")
    logger.info(f"{sales_agent_status['replies_received_count']} positive reply, {sales_agent_status['follow_ups_scheduled_count']} no response, {0} bounced emails.")
    logger.info(f"📅 Booked {sales_agent_status['calls_booked_count']} calls this week:")
    for call_info in sales_agent_status['booked_calls_list']:
        logger.info(f"- {call_info}")
    logger.info("Booking links + details in tracker.")

    logger.info(f"💰 Closed {sales_agent_status['deals_closed_count']} deal(s).")
    logger.info(f"Total pipeline value: ${sales_agent_status['total_pipeline_value']}.")

    logger.info("Sales agent finished.")

    logger.info("\n📊 Daily Sales Pipeline Report")
    logger.info(f"- New Leads Added: {sales_agent_status['new_leads_added']}")
    logger.info(f"- Outreach Sent: {sales_agent_status['outreach_sent_count']}")
    logger.info(f"- Replies Received: {sales_agent_status['replies_received_count']}") # This needs to be properly tracked
    logger.info(f"- Calls Booked: {sales_agent_status['calls_booked_count']}")
    logger.info(f"- Deals Closed: {sales_agent_status['deals_closed_count']} (${sales_agent_status['total_pipeline_value']})")
    logger.info(f"- Total Pipeline Value: ${sales_agent_status['total_pipeline_value']}") # This is redundant if deals closed includes value
    logger.info(f"- Follow-ups Scheduled: {sales_agent_status['follow_ups_scheduled_count']}")
    save_state()

if __name__ == "__main__":
    asyncio.run(run_sales_agent())