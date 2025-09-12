import os
import requests
from sales_agent.config import EMAIL_VERIFICATION_API_KEY
from sales_agent.utils.logger import logger

async def verify_email_with_abstractapi(email: str) -> dict:
    """Verifies an email address using AbstractAPI's Email Validation & Verification API.

    Args:
        email (str): The email address to verify.

    Returns:
        dict: A dictionary containing the verification results.
              Returns an empty dictionary if the API key is missing or an error occurs.
    """
    if not EMAIL_VERIFICATION_API_KEY:
        logger.error("EMAIL_VERIFICATION_API_KEY is not set in config.py. Cannot perform email verification.")
        return {}

    api_url = f"https://emailvalidation.abstractapi.com/v1/?api_key={EMAIL_VERIFICATION_API_KEY}&email={email}"

    try:
        response = requests.get(api_url)
        response.raise_for_status()  # Raise an exception for HTTP errors (4xx or 5xx)
        logger.info(f"AbstractAPI response: {response.json()}")
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        logger.error(f"HTTP error occurred: {http_err} - Response: {response.text}")
        return {}
    except requests.exceptions.ConnectionError as conn_err:
        logger.error(f"Connection error occurred: {conn_err}")
        return {}
    except requests.exceptions.Timeout as timeout_err:
        logger.error(f"Timeout error occurred: {timeout_err}")
        return {}
    except requests.exceptions.RequestException as req_err:
        logger.error(f"An unexpected error occurred: {req_err}")
        return {}