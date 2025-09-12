from sales_agent.utils.logger import logger
import instructor
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List

client = instructor.patch(OpenAI())

class SocialMediaPost(BaseModel):
    platform: str = Field(..., description="The target social media platform (e.g., Twitter, LinkedIn).")
    content: str = Field(..., description="The content of the social media post.")

class SocialMediaPosts(BaseModel):
    posts: List[SocialMediaPost]

async def generate_social_media_posts(topic: str, platforms: list) -> SocialMediaPosts:
    logger.info(f"Generating social media posts on topic: {topic}")

    prompt = f"""
    Generate a series of social media posts on the following topic, tailored for different platforms.

    **Topic:** {topic}
    **Platforms:** {', '.join(platforms)}

    **Instructions:**
    - Create a unique post for each specified platform.
    - Tailor the content and tone to the platform (e.g., professional for LinkedIn, concise for Twitter).
    - Include relevant hashtags.
    - The posts should be engaging and designed to drive conversation.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            response_model=SocialMediaPosts,
            messages=[
                {"role": "system", "content": "You are a social media marketing expert."},
                {"role": "user", "content": prompt},
            ],
            max_retries=2,
        )
        logger.info("Social media posts generated successfully.")
        return response
    except Exception as e:
        logger.error(f"Error during social media post generation: {e}")
        return SocialMediaPosts(posts=[])