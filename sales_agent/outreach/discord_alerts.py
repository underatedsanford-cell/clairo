import asyncio
import httpx
import json
from sales_agent.config import DISCORD_WEBHOOK_URL
from sales_agent.utils.logger import logger

async def send_discord_alert(message, level="info"):
    if not DISCORD_WEBHOOK_URL:
        logger.warning("Discord webhook URL not configured. Cannot send alert.")
        return

    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "content": f"[{level.upper()}] {message}"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await asyncio.to_thread(client.post, DISCORD_WEBHOOK_URL, headers=headers, content=json.dumps(payload))
            response.raise_for_status()  # Raise an HTTPError for bad responses (4xx or 5xx)
        logger.info(f"Discord alert sent successfully: {message}")
    except httpx.RequestError as e:
        logger.error(f"Failed to send Discord alert: {e}")