import asyncio
from sales_agent.utils.logger import logger
import instructor
from openai import OpenAI
from pydantic import BaseModel
from sales_agent.config import OPENAI_API_KEY


class OutreachScript(BaseModel):
    script: str


client = instructor.patch(OpenAI(api_key=OPENAI_API_KEY))


async def generate_outreach_script(lead_data: dict):
    """Generates a personalized cold-outreach script using an AI model."""
    logger.info(f"Generating personalized script for {lead_data.get('lead_name')}")

    # Create a detailed prompt for the AI model
    # 3. Use AI to generate the outreach script
    prompt = f"""
    You are an expert sales development representative specializing in personalized cold outreach.

    **Lead Information:**
    - **Name:** {lead_data.get('name', 'N/A')}
    - **Company:** {lead_data.get('company', 'N/A')}
    - **Role:** {lead_data.get('role', 'N/A')}
    - **Pain Points:** {lead_data.get('pain_points', 'N/A')}
    - **Recent Activities:** {lead_data.get('recent_activities', 'N/A')}
    - **Website:** {lead_data.get('website', 'N/A')}

    **Instructions:**
    1.  **Opening:** Start with a personalized opening that references the lead's recent activities, company news, or a shared connection.
    2.  **Value Proposition:** Clearly and concisely explain how your product/service can address their specific pain points. Focus on benefits, not just features.
    3.  **Call to Action (CTA):** End with a clear and low-friction CTA. Suggest a brief 15-minute call to discuss their needs further.
    4.  **Tone:** Be professional, respectful, and confident. Avoid overly casual language or aggressive sales tactics.

    **Example Script:**
    "Hi [Name], I saw your recent post on LinkedIn about [Recent Activity] and was impressed by your insights. At [Your Company], we help [Lead's Role]s like you at [Lead's Company] to overcome [Pain Point]. I'd love to share how we've helped similar companies achieve [Benefit]. Would you be open to a brief 15-minute chat next week?"

    **Generate a new, unique, and highly personalized outreach script based on the lead's information.**
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            response_model=OutreachScript,
            messages=[
                {"role": "system", "content": "You are a world-class sales scriptwriter."},
                {"role": "user", "content": prompt},
            ],
            max_retries=2,
        )
        return response.script
    except Exception as e:
        logger.error(f"Error generating script: {e}")
        # Fallback to a template if the AI model fails
        return f"""
Subject: Unlocking Growth for {lead_data.get('company', 'your company')}

Hi {lead_data.get('lead_name', 'there')},

I noticed you're the {lead_data.get('role', 'key person')} at {lead_data.get('company', 'your company')}, and I was impressed by your work in the industry.

At our company, we specialize in AI-powered sales automation that helps businesses like yours streamline their outreach and close more deals.

Would you be open to a brief 15-minute chat next week to explore how we can help {lead_data.get('company', 'your company')} achieve its sales goals?

Best regards,
[Your Name]
"""