# Utility functions and helpers

import os
import smtplib
from email.mime.text import MIMEText
from sales_agent.config import SLACK_WEBHOOK_URL, ALERT_EMAIL_ADDRESS, ALERT_EMAIL_PASSWORD, ALERT_EMAIL_SMTP_SERVER, ALERT_EMAIL_SMTP_PORT
from sales_agent.utils.logger import logger

def send_alert(message, subject="Sales Agent Alert"):
    """Sends an alert via email or Slack."""
    # Try sending via email first
    if ALERT_EMAIL_ADDRESS and ALERT_EMAIL_PASSWORD and ALERT_EMAIL_SMTP_SERVER and ALERT_EMAIL_SMTP_PORT:
        try:
            msg = MIMEText(message)
            msg['Subject'] = subject
            msg['From'] = ALERT_EMAIL_ADDRESS
            msg['To'] = ALERT_EMAIL_ADDRESS # Sending to self for simplicity

            with smtplib.SMTP_SSL(ALERT_EMAIL_SMTP_SERVER, ALERT_EMAIL_SMTP_PORT) as server:
                server.login(ALERT_EMAIL_ADDRESS, ALERT_EMAIL_PASSWORD)
                server.send_message(msg)
            logging.info(f"Email alert sent: {subject}")
            return
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")

    # Fallback to Slack if email fails or not configured
    if SLACK_WEBHOOK_URL:
        try:
            import requests
            payload = {'text': f"*{subject}*\n{message}"}
            response = requests.post(SLACK_WEBHOOK_URL, json=payload)
            response.raise_for_status()
            logging.info(f"Slack alert sent: {subject}")
            return
        except ImportError:
            logger.error("Requests library not found. Cannot send Slack alerts. Please install it: pip install requests")
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")

    print(f"ALERT: {message}") # Print to console if no alert method is configured or fails2