import asyncio
from sales_agent.utils.logger import logger
import instructor
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List
from googlesearch import search

client = instructor.patch(OpenAI())

class Trend(BaseModel):
    name: str = Field(..., description="The name of the market trend.")
    description: str = Field(..., description="A brief description of the trend.")
    is_emerging: bool = Field(..., description="Whether the trend is emerging or established.")

class MarketTrends(BaseModel):
    trends: List[Trend]

async def detect_trends(keyword: str) -> MarketTrends:
    logger.info(f"Detecting trends for keyword: {keyword}")

    # 1. Search for news, articles, and discussions
    queries = [
        f'{keyword} market trends',
        f'{keyword} industry news',
        f'{keyword} future of',
    ]
    search_results = []
    for query in queries:
        search_results.extend([j for j in search(query, num=3, stop=3, pause=2)])

    # 2. Analyze search results (simplified)
    scraped_content = "".join(search_results)

    # 3. Use AI to identify and summarize trends
    prompt = f"""
    Analyze the following content to identify key market trends related to {keyword}.

    **Content:**
    {scraped_content}

    **Instructions:**
    - Identify at least 2-3 significant market trends.
    - For each trend, provide a name and a brief description.
    - Indicate whether the trend is emerging or already established.
    - Provide the output in a structured format.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            response_model=MarketTrends,
            messages=[
                {"role": "system", "content": "You are a skilled market analyst specializing in trend detection."},
                {"role": "user", "content": prompt},
            ],
            max_retries=2,
        )
        logger.info("Trend detection completed successfully.")
        return response
    except Exception as e:
        logger.error(f"Error during trend detection: {e}")
        return MarketTrends(trends=[])