from ..outreach.twilio_sms import send_sms
from ..outreach.gmail_smtp import send_email
from sales_agent.utils.logger import logger
from ..leads.google_sheets import GoogleSheet
from ..config import CALENDLY_TIDYCAL_LINK
from .ai_assistant import get_calendar_action, CalendarAction

async def handle_booking_request(google_sheet_instance: GoogleSheet, lead, reply_channel, user_message: str):
    """Handles booking requests by analyzing user intent and sending a booking link if appropriate."""
    calendar_action = await get_calendar_action(user_message)

    if calendar_action.action == "schedule" and calendar_action.confirmation:
        logger.info(f"User intent is to schedule. Sending booking link to {lead.get('Lead Name')}.")
        return await send_booking_link(google_sheet_instance, lead, reply_channel)
    else:
        logger.info(f"User intent is not to schedule at this time. Action: {calendar_action.action}")
        # In the future, you could handle reschedule/cancel/inform actions here
        return False


async def send_booking_link(google_sheet_instance: GoogleSheet, lead, reply_channel):
    """Sends the Calendly/TidyCal booking link via the specified channel (SMS or email)."""
    booking_link = CALENDLY_TIDYCAL_LINK
    if not booking_link:
        logger.error("CALENDLY_TIDYCAL_LINK not configured in config.py")
        return False

    if reply_channel == 'sms':
        if 'Direct Phone' in lead and lead['Direct Phone']:
            message = f"Hi {lead['Lead Name']}, Thanks for your interest! You can book a call with us using this link: {booking_link}"
            print(f"Sending booking link via SMS to {lead['Direct Phone']}")
            if await send_sms(lead['Direct Phone'], message):
                await google_sheet_instance.update_lead_data(lead['Lead Name'], {'Status': 'Booking Link Sent (SMS)'})
                return True
            else:
                logger.error(f"Failed to send booking link SMS to {lead['Direct Phone']}")
                return False
        else:
            logger.error(f"No direct phone for {lead['Lead Name']}, cannot send booking link via SMS.")
            return False
    elif reply_channel == 'email':
        if 'Work Email' in lead and lead['Work Email']:
            subject = "Book Your Call Here!"
            body = f"""dear {lead['Lead Name']},
I know you are incredibly busy and you get a lot of emails, so this only takes only 60 seconds to read
We specialize in helping businesses like yours streamline their sales process through AI automation.
Are you available for a brief call to discuss how our AI-powered sales agent can help you close more deals? You can book a slot directly here: {booking_link}
I totally understand if you are too busy to respond, but even a one-or-two reply would really make my day.
All the best
Sanford"""
            print(f"Sending booking link via email to {lead['Work Email']}")
            if await send_email(lead['Work Email'], subject, body):
                await google_sheet_instance.update_lead_data(lead['Lead Name'], {'Status': 'Booking Link Sent (Email)'})
                return True
            else:
                logger.error(f"Failed to send booking link email to {lead['Work Email']}")
                return False
        else:
            logger.error(f"No work email for {lead['Lead Name']}, cannot send booking link via email.")
            return False
    else:
        logger.error(f"Unsupported reply channel: {reply_channel}. Only 'sms' or 'email' are supported for sending booking links.")
        return False