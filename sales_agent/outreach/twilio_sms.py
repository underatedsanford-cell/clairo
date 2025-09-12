from twilio.rest import Client
from sales_agent.config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
from sales_agent.utils.logger import logger
import asyncio

async def send_sms(to_phone_number, message):
    """Sends an SMS message using Twilio."""
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_PHONE_NUMBER:
        logger.error("Twilio credentials not configured in config.py")
        return False

    logger.info(f"Attempting to initialize Twilio Client with SID: {TWILIO_ACCOUNT_SID} and Token: {TWILIO_AUTH_TOKEN}")
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = await asyncio.to_thread(client.messages.create,
            to=to_phone_number,
            from_=TWILIO_PHONE_NUMBER,
            body=message
        )
        print(f"SMS sent to {to_phone_number}: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Error sending SMS to {to_phone_number}: {e}")
        return False