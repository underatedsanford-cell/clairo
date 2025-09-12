import smtplib
from sales_agent.utils.logger import logger

async def send_email(recipient_email, subject, body, name, company):
    """Sends an email using a mock function."""
    logger.info(f"MOCK email sent to {recipient_email} for {name} at {company}.")
    logger.info(f"Subject: {subject}")
    logger.info(f"Body: {body}")
    return True