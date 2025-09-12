import logging
from datetime import datetime
from sales_agent.leads.google_sheets import GoogleSheet
import logging
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests

from sales_agent.leads.google_sheets import GoogleSheet
from sales_agent.config import (
    GOOGLE_SHEET_ID, GOOGLE_SHEETS_CREDENTIALS_PATH,
    SLACK_WEBHOOK_URL, ALERT_EMAIL_ADDRESS, ALERT_EMAIL_PASSWORD,
    ALERT_EMAIL_SMTP_SERVER, ALERT_EMAIL_SMTP_PORT
)

logger = logging.getLogger(__name__)

async def log_error_to_sheet(error_message: str, details: str = ""):
    try:
        google_sheet = GoogleSheet(GOOGLE_SHEET_ID, GOOGLE_SHEETS_CREDENTIALS_PATH)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        error_data = {
            "Timestamp": timestamp,
            "Error Message": error_message,
            "Details": details
        }
        await google_sheet.append_row_to_sheet("Logs", list(error_data.keys()), list(error_data.values()))
        logger.info(f"Error logged to Google Sheet: {error_message}")
    except Exception as e:
        logger.error(f"Failed to log error to Google Sheet: {e}")

async def send_slack_alert(message: str):
    if SLACK_WEBHOOK_URL:
        try:
            payload = {'text': message}
            response = requests.post(SLACK_WEBHOOK_URL, json=payload)
            response.raise_for_status()
            logger.info("Slack alert sent successfully.")
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to send Slack alert: {e}")

async def send_email_alert(subject: str, body: str):
    if ALERT_EMAIL_ADDRESS and ALERT_EMAIL_PASSWORD and ALERT_EMAIL_SMTP_SERVER and ALERT_EMAIL_SMTP_PORT:
        try:
            msg = MIMEMultipart()
            msg['From'] = ALERT_EMAIL_ADDRESS
            msg['To'] = ALERT_EMAIL_ADDRESS  # Send alert to self
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            with smtplib.SMTP(ALERT_EMAIL_SMTP_SERVER, int(ALERT_EMAIL_SMTP_PORT)) as server:
                server.starttls()
                server.login(ALERT_EMAIL_ADDRESS, ALERT_EMAIL_PASSWORD)
                server.send_message(msg)
            logger.info("Email alert sent successfully.")
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")

async def log_error_and_alert(error_message: str, details: str = ""):
    await log_error_to_sheet(error_message, details)
    alert_message = f"Error Detected: {error_message}\nDetails: {details}"
    await send_slack_alert(alert_message)
    await send_email_alert("Sales Agent Error Alert", alert_message)