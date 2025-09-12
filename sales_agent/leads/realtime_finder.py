import logging
import asyncio
import time
import json
from sales_agent.leads.enrichment import enrich_lead_data
from sales_agent.leads.google_sheets import GoogleSheet
import threading
from sales_agent import config
from sales_agent.utils.logger import logger
from sales_agent.utils.email_verification import verify_email_with_abstractapi as verify_email
from sales_agent.shared_state import recent_leads_storage
import os
from openai import OpenAI
import instructor
from pydantic import BaseModel, Field
from typing import List, Optional
import re
from urllib.parse import urlparse
import httpx
from bs4 import BeautifulSoup

# Initialize GoogleSheets
sheets = GoogleSheet(sheet_id=config.GOOGLE_SHEET_ID, credentials_path=config.GOOGLE_SHEETS_CREDENTIALS_PATH)

# Initialize Instructor with OpenAI client
from sales_agent.config import OPENAI_API_KEY

# Initialize the OpenAI client with the API key
client = instructor.from_openai(OpenAI(api_key=OPENAI_API_KEY))

class Lead(BaseModel):
    company_name: str = Field(..., description="The name of the company.")
    website: Optional[str] = Field(None, description="The company's website URL.")
    phone: Optional[str] = Field(None, description="The company's phone number.")
    email: Optional[str] = Field(None, description="The company's email address.")
    linkedin: Optional[str] = Field(None, description="The company's LinkedIn profile URL.")
    source: str = Field(..., description="The source from where the lead was found (e.g., 'Google Maps').")

class LeadList(BaseModel):
    leads: List[Lead]

def is_valid_email(email):
    """
    Checks if an email address is valid and not a generic one.
    """
    if not email or not isinstance(email, str):
        return False
    
    # Regex for a valid email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return False
        
    # List of generic email prefixes to filter out
    generic_prefixes = ['info@', 'contact@', 'support@', 'admin@', 'hello@', 'sales@', 'team@', 'office@', 'mail@', 'info@', 'no-reply@', 'noreply@']
    if any(email.lower().startswith(prefix) for prefix in generic_prefixes):
        return False
        
    return True

async def extract_social_links(url, client):
    """
    Extracts social media links (LinkedIn, Twitter, Facebook) from a given URL.
    """
    social_links = {
        'linkedin': None,
        'twitter': None,
        'facebook': None
    }
    try:
        response = await client.get(url, timeout=10, follow_redirects=True)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        for a in soup.find_all('a', href=True):
            href = a['href']
            if 'linkedin.com/company' in href and not social_links['linkedin']:
                social_links['linkedin'] = href
            elif 'twitter.com/' in href and not social_links['twitter']:
                social_links['twitter'] = href
            elif 'facebook.com/' in href and not social_links['facebook']:
                social_links['facebook'] = href
                
    except httpx.RequestError as e:
        print(f"Could not fetch {url}: {e}")
        
    return social_links

async def find_contact_page(url, client):
    """
    Tries to find the contact page URL from the website's homepage.
    """
    try:
        response = await client.get(url, timeout=10, follow_redirects=True)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for links with text like 'contact'
        for a in soup.find_all('a', href=True):
            if 'contact' in a.text.lower():
                contact_url = a['href']
                if not contact_url.startswith('http'):
                    base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
                    contact_url = f"{base_url}{contact_url}"
                return contact_url
                
    except httpx.RequestError as e:
        print(f"Could not fetch {url} to find contact page: {e}")
        
    return None

async def extract_emails_from_url(url, client):
    """
    Extracts email addresses from a given URL.
    """
    emails = []
    try:
        response = await client.get(url, timeout=10, follow_redirects=True)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Regex to find email addresses
        email_regex = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
        
        # Search for emails in the text
        found_emails = re.findall(email_regex, soup.get_text())
        emails.extend(found_emails)
        
        # Search for emails in mailto links
        for a in soup.find_all('a', href=True):
            if a['href'].startswith('mailto:'):
                email = a['href'].replace('mailto:', '')
                emails.append(email)
                
    except httpx.RequestError as e:
        print(f"Could not fetch {url} to extract emails: {e}")
        
    return list(set(emails)) # Return unique emails



async def search_google(query, api_key, cse_id, **kwargs):
    """
    Performs a Google search using the Custom Search JSON API.
    """
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        'key': api_key,
        'cx': cse_id,
        'q': query,
    }
    params.update(kwargs)
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error during Google search: {e.response.status_code} - {e.response.text}")
        except httpx.RequestError as e:
            logger.error(f"Request error during Google search: {e}")
    return None

async def find_leads_from_google_maps(niche, location, desired_count=10, client=None):
    """
    Finds leads from Google Maps using Google Custom Search API.
    """
    leads = []
    query = f"{niche} in {location}"
    
    results = await search_google(query, config.GOOGLE_API_KEY, config.CUSTOM_SEARCH_ENGINE_ID, num=desired_count)
    
    if not results or 'items' not in results:
        return leads

    for item in results['items']:
        company_name = item.get('title')
        website = item.get('link')
        
        # Extract more details from pagemap if available
        pagemap = item.get('pagemap', {})
        metatags = pagemap.get('metatags', [{}])[0]
        
        phone = metatags.get('telephone')

        lead = {
            'company_name': company_name,
            'phone': phone,
            'website': website,
            'email': None,
            'linkedin': None,
            'source': 'Google Custom Search'
        }

        if website:
            # Extract social links from the website
            social_links = await extract_social_links(website, client)
            lead.update(social_links)
            
            # Find and extract emails from the contact page
            contact_page_url = await find_contact_page(website, client)
            if contact_page_url:
                emails = await extract_emails_from_url(contact_page_url, client)
                if emails:
                    for email in emails:
                        if is_valid_email(email):
                            lead['email'] = email
                            break
            
            # If no email from contact page, try to find it from the main website
            if not lead.get('email'):
                emails = await extract_emails_from_url(website, client)
                if emails:
                    for email in emails:
                        if is_valid_email(email):
                            lead['email'] = email
                            break
        
        leads.append(lead)
        if len(leads) >= desired_count:
            break
            
    return leads

async def find_leads_from_linkedin(niche, location, desired_count=10, client=None):
    """
    Finds leads from LinkedIn using Google Custom Search API.
    """
    leads = []
    query = f'site:linkedin.com/company "{niche}" "{location}"'
    
    results = await search_google(query, config.GOOGLE_API_KEY, config.CUSTOM_SEARCH_ENGINE_ID, num=desired_count)

    if not results or 'items' not in results:
        return leads

    for item in results['items']:
        company_name = item.get('title', '').split(' | ')[0]
        linkedin_url = item.get('link')
        
        if company_name and linkedin_url:
            lead = {
                'company_name': company_name,
                'linkedin': linkedin_url,
                'source': 'LinkedIn (via Google)'
            }
            
            snippet = item.get('snippet', '')
            
            phone_match = re.search(r'(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}', snippet)
            if phone_match:
                lead['phone'] = phone_match.group(0)
                
            website_match = re.search(r'https?://[^\s/$.?#].[^\s]*', snippet)
            if website_match:
                website = website_match.group(0)
                lead['website'] = website
                
                social_links = await extract_social_links(website, client)
                lead.update(social_links)
                
                contact_page_url = await find_contact_page(website, client)
                if contact_page_url:
                    emails = await extract_emails_from_url(contact_page_url, client)
                    if emails:
                        for email in emails:
                            if is_valid_email(email):
                                lead['email'] = email
                                break
                
                if not lead.get('email'):
                    emails = await extract_emails_from_url(website, client)
                    if emails:
                        for email in emails:
                            if is_valid_email(email):
                                lead['email'] = email
                                break

            leads.append(lead)
            if len(leads) >= desired_count:
                break
                
    return leads

async def find_leads_realtime(
    niche: str,
    location: str,
    channels: List[str],
    desired_count: int = 10,
    on_lead: callable = None
):
    """
    Finds leads in real-time from various sources based on the selected channels.
    """
    
    logging.info(f"Starting real-time lead search for niche='{niche}', location='{location}', channels={channels}, desired_count={desired_count}")

    all_leads = []
    
    # Get existing company names to avoid duplicates
    existing_companies = await sheets.get_all_company_names()
    processed_companies = set(company.lower() for company in existing_companies)

    # Determine which functions to call based on channels
    source_functions = []
    if 'google_maps' in channels:
        source_functions.append(find_leads_from_google_maps)
    if 'linkedin' in channels:
        source_functions.append(find_leads_from_linkedin)
    
    if not source_functions:
        logging.warning("No valid channels selected for lead generation.")
        return []

    async with httpx.AsyncClient() as client:
        tasks = [func(niche, location, desired_count=desired_count, client=client) for func in source_functions]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                logging.error(f"Error in source function: {result}")
                continue

            for lead_data in result:
                if len(all_leads) >= desired_count:
                    break

                # Avoid processing the same company again
                if lead_data['company_name'].lower() in processed_companies:
                    continue
                
                processed_companies.add(lead_data['company_name'].lower())

                # Create a Lead object
                lead = Lead(**lead_data)
                
                # Enrich the lead with additional details
                if lead.website:
                    # Extract social links
                    social_links = await extract_social_links(lead.website, client)
                    if social_links.get('linkedin'):
                        lead.linkedin = social_links['linkedin']
                    
                    # Find and extract emails
                    if not lead.email:
                        contact_page_url = await find_contact_page(lead.website, client)
                        if contact_page_url:
                            emails = await extract_emails_from_url(contact_page_url, client)
                            if emails:
                                for email in emails:
                                    if is_valid_email(email):
                                        lead.email = email
                                        break
                        
                        # If no email from contact page, try the main website
                        if not lead.email:
                            emails = await extract_emails_from_url(lead.website, client)
                            if emails:
                                for email in emails:
                                    if is_valid_email(email):
                                        lead.email = email
                                        break
                
                # Verify email if found
                if lead.email:
                    verification_result = verify_email(lead.email)
                    if not verification_result['is_valid']:
                        logging.warning(f"Email '{lead.email}' for '{lead.company_name}' is not valid. Reason: {verification_result['reason']}")
                        lead.email = None # Discard invalid email

                # Add the lead to the list if it has at least one channel
                if lead.email or lead.phone or lead.linkedin:
                    all_leads.append(lead)
                    
                    # If a callback is provided, call it with the new lead
                    if on_lead:
                        try:
                            on_lead(lead.dict())
                        except Exception as e:
                            logging.error(f"Error in on_lead callback: {e}")

                    # Store in recent leads
                    recent_leads_storage.add_lead(lead.dict())
                    
                    # Also save to Google Sheets
                    try:
                        await sheets.add_lead(lead.dict())
                    except Exception as e:
                        logging.error(f"Failed to add lead to Google Sheets: {e}")

    logging.info(f"Found {len(all_leads)} leads in total.")
    
    return [lead.dict() for lead in all_leads]

if __name__ == '__main__':
    # Example usage of the real-time lead finder
    
    def handle_new_lead(lead_data):
        """
        This function is called whenever a new lead is found.
        """
        print("\n" + "="*20)
        print("🔥 New Lead Found! 🔥")
        print(json.dumps(lead_data, indent=4))
        print("="*20 + "\n")

    # Configuration for the lead search
    niche_to_search = "software companies"
    location_to_search = "New York"
    channels_to_use = ['google_maps', 'linkedin'] # Can be ['google_maps'], ['linkedin'], or both
    number_of_leads_to_find = 10

    # Run the real-time lead finder
    final_leads = asyncio.run(find_leads_realtime(
        niche=niche_to_search,
        location=location_to_search,
        channels=channels_to_use,
        desired_count=number_of_leads_to_find,
        on_lead=handle_new_lead
    ))

    print("\n" + "="*30)
    print("Lead Generation Complete")
    print(f"Total leads found: {len(final_leads)}")
    print("="*30)
    
    # You can also access the final list of leads
    # print("\nFinal list of leads:")
    # print(json.dumps(final_leads, indent=4))