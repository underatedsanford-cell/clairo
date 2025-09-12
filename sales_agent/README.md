# AI Sales Closing Workflow

This project implements an automated sales closing workflow using Python, integrating various APIs for lead intake, enrichment, personalized outreach, follow-up, call booking, AI-driven closing calls, and CRM updates.

## Project Structure

- `main.py`: The main entry point for the application.
- `config.py`: Configuration file for API keys and other settings.
- `requirements.txt`: Lists Python dependencies.
- `utils.py`: Contains utility and helper functions.
- `leads/`: (To be created) Directory for lead-related modules.
- `outreach/`: (To be created) Directory for outreach-related modules.
- `calls/`: (To be created) Directory for AI-driven call modules.

## Setup Instructions

1.  **Clone the repository (if applicable):**

    ```bash
    git clone <repository_url>
    cd sales_agent
    ```

2.  **Create a virtual environment (recommended):**

    ```bash
    python -m venv venv
    ./venv/Scripts/activate  # On Windows
    source venv/bin/activate  # On macOS/Linux
    ```

3.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure API Keys and Settings:**

    Open `config.py` and fill in your API keys and other necessary configurations for Google Sheets, enrichment APIs (Clearbit/InstantData), OpenAI (GPT-4, Whisper, OpenVoice/Bark), Twilio, Gmail/SMTP, Calendly/TidyCal, and Slack/Email alerts.

## Running the Application

To start the sales agent, run:

```bash
python main.py
```

## Workflow Overview

The sales closing workflow consists of the following stages:

1.  **Lead Intake & Storage:** Watches a Google Sheet for new leads.
2.  **Lead Enrichment:** Calls an email/phone enrichment API.
3.  **Personalized Outreach:** Generates and sends cold outreach messages via SMS or email.
4.  **Follow-Up & Qualification:** Sends follow-up messages if no reply.
5.  **Call Booking:** Sends a booking link upon positive reply.
6.  **AI-Driven Closing Call:** Triggers a Twilio voice call with AI-generated responses.
7.  **Deal Confirmation & CRM Update:** Classifies outcome and updates Google Sheet.
8.  **Error Handling & Logging:** Logs errors and sends alerts.