import asyncio
from sales_agent.utils.logger import logger
import instructor
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List
from googlesearch import search

client = instructor.patch(OpenAI())

class Insight(BaseModel):
    text: str = Field(..., description="A specific customer insight.")
    sentiment: str = Field(..., description="The sentiment of the insight (e.g., Positive, Negative, Neutral).")
    source: str = Field(..., description="The source of the insight (e.g., forum, review site).")

class CustomerInsights(BaseModel):
    insights: List[Insight]

async def get_customer_insights(topic: str) -> CustomerInsights:
    logger.info(f"Scraping reviews and forums for customer insights on topic: {topic}")

    # 1. Search for relevant forums and review sites
    queries = [
        f'{topic} reviews',
        f'{topic} customer feedback',
        f'{topic} forum discussion',
    ]
    search_results = []
    for query in queries:
        search_results.extend([j for j in search(query, num=3, stop=3, pause=2)])

    # 2. Scrape and analyze content (simplified)
    scraped_content = "".join(search_results)

    # 3. Use AI to extract customer insights
    prompt = f"""
    Analyze the following content from reviews and forums to extract key customer insights about {topic}.

    **Content:**
    {scraped_content}

    **Instructions:**
    - Identify specific customer pain points, desires, and feedback.
    - Determine the sentiment of each insight (Positive, Negative, or Neutral).
    - Note the source or type of content (e.g., review, forum post).
    - Provide the output in a structured format.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            response_model=CustomerInsights,
            messages=[
                {"role": "system", "content": "You are an expert in customer research and sentiment analysis."},
                {"role": "user", "content": prompt},
            ],
            max_retries=2,
        )
        logger.info("Customer insights extraction completed successfully.")
        return response
    except Exception as e:
        logger.error(f"Error during customer insights extraction: {e}")
        return CustomerInsights(insights=[])