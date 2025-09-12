import asyncio
from sales_agent.utils.logger import logger
import instructor
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List
from googlesearch import search

client = instructor.patch(OpenAI())

class Competitor(BaseModel):
    name: str = Field(..., description="The name of the competitor.")
    strengths: List[str] = Field(..., description="The key strengths of the competitor.")
    weaknesses: List[str] = Field(..., description="The key weaknesses of the competitor.")
    strategy: str = Field(..., description="The competitor's likely market strategy.")

class CompetitorAnalysis(BaseModel):
    competitors: List[Competitor]

async def analyze_competitors(niche: str, region: str) -> CompetitorAnalysis:
    logger.info(f"Performing competitor analysis for niche: {niche} in region: {region}")

    # 1. Search for competitors
    query = f"top competitors in {niche} in {region}"
    search_results = [j for j in search(query, num=5, stop=5, pause=2)]

    # 2. Scrape and analyze search results (simplified for this example)
    # In a real-world scenario, you would use a library like BeautifulSoup to scrape content
    scraped_content = "".join(search_results)

    # 3. Use AI to extract competitor insights
    prompt = f"""
    Analyze the following search results to identify key competitors, their strengths, weaknesses, and strategies.

    **Search Results:**
    {scraped_content}

    **Instructions:**
    - Identify at least 3-5 key competitors.
    - For each competitor, list their primary strengths and weaknesses.
    - Describe their likely market strategy.
    - Provide the output in a structured format.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            response_model=CompetitorAnalysis,
            messages=[
                {"role": "system", "content": "You are a world-class market intelligence analyst."},
                {"role": "user", "content": prompt},
            ],
            max_retries=2,
        )
        logger.info("Competitor analysis completed successfully.")
        return response
    except Exception as e:
        logger.error(f"Error during competitor analysis: {e}")
        return CompetitorAnalysis(competitors=[])