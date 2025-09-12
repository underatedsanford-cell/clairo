# Configuration file for API keys and other settings
import os
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path=dotenv_path)


# API Keys and Configuration
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
DEEPSEEK_API_BASE = "https://api.deepseek.com/v1"

# Prioritize OPENAI_API_KEY_2, then OPENAI_API_KEY, then DEEPSEEK_API_KEY as fallback
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY_1") or os.environ.get("OPENAI_API_KEY_2")

CALENDLY_TIDYCAL_LINK = os.environ.get("CALENDLY_TIDYCAL_LINK", "https://calendly.com/your-booking-link")

if not OPENAI_API_KEY or OPENAI_API_KEY.strip() == "":
    print("OPENAI_API_KEY is not set or is empty in config.py. Attempting to use DeepSeek API key as fallback.")
    if DEEPSEEK_API_KEY:
        print("DeepSeek API key is available and will be used.")
    else:
        print("No DeepSeek API key found either. Please set OPENAI_API_KEY_2, OPENAI_API_KEY, or DEEPSEEK_API_KEY.")

GOOGLE_SHEET_ID = os.environ.get("GOOGLE_SHEET_ID")
GOOGLE_SHEETS_CREDENTIALS_PATH = os.environ.get("GOOGLE_SHEETS_CREDENTIALS_PATH")

# Gmail SMTP Configuration
GMAIL_SMTP_EMAIL = os.environ.get("GMAIL_SMTP_EMAIL")
GMAIL_SMTP_SERVER = os.environ.get("GMAIL_SMTP_SERVER")
GMAIL_SMTP_PORT = os.environ.get("GMAIL_SMTP_PORT")
GMAIL_SMTP_PASSWORD = os.environ.get("GMAIL_SMTP_PASSWORD") # Use app password for security

# Discord Bot Configuration
DISCORD_BOT_TOKEN = os.environ.get("DISCORD_BOT_TOKEN")
DISCORD_CHANNEL_ID = os.environ.get("DISCORD_CHANNEL_ID")
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER")
CLEARBIT_INSTANTDATA_API_KEY = os.getenv("CLEARBIT_INSTANTDATA_API_KEY")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
SERPAPI_API_KEY = os.environ.get("SERPAPI_API_KEY")

# Google Custom Search API Configuration
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
CUSTOM_SEARCH_ENGINE_ID = os.environ.get("CUSTOM_SEARCH_ENGINE_ID")

ENRICHMENT_API_KEY = "68927c018f5ae972f1b9758e"
EMAIL_VERIFICATION_API_KEY = os.getenv("EMAIL_VERIFICATION_API_KEY")
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")
RECORDING_STATUS_CALLBACK_URL = os.getenv('RECORDING_STATUS_CALLBACK_URL')
DISCORD_WEBHOOK_URL = os.getenv('DISCORD_WEBHOOK_URL')
ALERT_EMAIL_ADDRESS = os.getenv("ALERT_EMAIL_ADDRESS")
ALERT_EMAIL_PASSWORD = os.getenv("ALERT_EMAIL_PASSWORD")
ALERT_EMAIL_SMTP_SERVER = os.getenv("ALERT_EMAIL_SMTP_SERVER")
ALERT_EMAIL_SMTP_PORT = os.getenv("ALERT_EMAIL_SMTP_PORT")




def update_config(**kwargs):
    config_path = os.path.abspath(__file__)
    with open(config_path, 'r') as f:
        lines = f.readlines()

    with open(config_path, 'w') as f:
        for line in lines:
            updated = False
            for key, value in kwargs.items():
                if line.strip().startswith(f'{key} ='):
                    # Special handling for API keys to ensure they are written directly
                    if key == 'OPENAI_API_KEY' or key == 'DEEPSEEK_API_KEY' or key == 'ENRICHMENT_API_KEY':
                        f.write(f'{key} = "{value}"\n')
                    else:
                        f.write(f'{key} = "{value}"\n')
                    updated = True
                    break
            if not updated:
                f.write(line)

# Ensure all necessary environment variables are set in your .env file for the sales agent to function correctly.