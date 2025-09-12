import time
from datetime import datetime, timedelta
from sales_agent.utils.logger import logger
from sales_agent.leads.google_sheets import GoogleSheet
from sales_agent.config import GOOGLE_SHEET_ID, GOOGLE_SHEETS_CREDENTIALS_PATH
from .gpt_script_generation import generate_outreach_script

from ..outreach.twilio_sms import send_sms
from .gmail_smtp import send_email

async def check_and_send_follow_up(lead):
    """Checks if a follow-up is needed for a lead and sends it if necessary."""
    google_sheet = GoogleSheet(GOOGLE_SHEET_ID, GOOGLE_SHEETS_CREDENTIALS_PATH)

    if lead.get('Status') in ['Outreach Sent (SMS)', 'Outreach Sent (Email)', 'Follow-up Sent (SMS)', 'Follow-up Sent (Email)']:
        outreach_date_str = lead.get('Outreach Sent Date')
        if not outreach_date_str:
            logger.error(f"No 'Outreach Sent Date' for lead {lead['Lead Name']}, skipping follow-up check.")
            return

        try:
            outreach_date = datetime.strptime(outreach_date_str, '%Y-%m-%d %H:%M:%S')
            if datetime.now() - outreach_date >= timedelta(hours=48):
                if not lead.get('SMS Reply') and not lead.get('Email Reply'):
                    print(f"48 hours passed for {lead['Lead Name']}, sending follow-up.")
                    follow_up_script = "Just following up on my previous message. Are you still interested?"

                    follow_up_sent = False

                    # Try SMS first if phone is available and original outreach was SMS
                    if 'Direct Phone' in lead and lead['Direct Phone'] and lead.get('Status') == 'Outreach Sent (SMS)':
                        print(f"Attempting to send SMS follow-up to {lead['Direct Phone']}")
                        if await send_sms(lead['Direct Phone'], follow_up_script):
                            await google_sheet.update_lead_data(lead['Lead Name'], {'Status': 'Follow-up Sent (SMS)'})
                            follow_up_sent = True

                    # If SMS not sent or not applicable, try email
                    if not follow_up_sent and 'Work Email' in lead and lead['Work Email'] and lead.get('Status') == 'Outreach Sent (Email)':
                        print(f"Attempting to send email follow-up to {lead['Work Email']}")
                        if await send_email(lead['Work Email'], "Following Up", follow_up_script):
                            await google_sheet.update_lead_data(lead['Lead Name'], {'Status': 'Follow-up Sent (Email)'})
                            follow_up_sent = True

                    if not follow_up_sent:
                        logger.error(f"Failed to send follow-up for {lead['Lead Name']}: No appropriate channel or previous channel failed.")
                        await google_sheet.update_lead_data(lead['Lead Name'], {'Status': 'Follow-up Failed'})
                        await google_sheet.update_lead_score(lead['Lead Name'], -2) # -2 = Unresponsive after 2 messages
                else:
                    print(f"Lead {lead['Lead Name']} has replied, no follow-up needed.")
                    await google_sheet.update_lead_score(lead['Lead Name'], 3) # +3 = Responded to outreach
            else:
                print(f"Less than 48 hours passed for {lead['Lead Name']}, no follow-up needed yet.")
        except ValueError:
            logger.error(f"Invalid 'Outreach Sent Date' format for lead {lead['Lead Name']}: {outreach_date_str}")
    else:
        print(f"Lead {lead['Lead Name']} not in outreach sent status, skipping follow-up check.")