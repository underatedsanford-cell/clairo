from sales_agent.utils.logger import logger
import instructor
from openai import OpenAI
from pydantic import BaseModel, Field

client = instructor.patch(OpenAI())

class BlogPost(BaseModel):
    title: str = Field(..., description="The title of the blog post.")
    content: str = Field(..., description="The full content of the blog post.")

async def generate_blog_post(topic: str, keywords: list) -> BlogPost:
    logger.info(f"Generating blog post on topic: {topic}")

    prompt = f"""
    Generate a high-quality, engaging, and SEO-optimized blog post on the following topic:

    **Topic:** {topic}
    **Keywords:** {', '.join(keywords)}

    **Instructions:**
    - The blog post should be well-structured with a clear introduction, body, and conclusion.
    - Incorporate the keywords naturally throughout the content.
    - The tone should be authoritative and informative.
    - Ensure the content is original and provides value to the reader.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            response_model=BlogPost,
            messages=[
                {"role": "system", "content": "You are an expert content writer and SEO specialist."},
                {"role": "user", "content": prompt},
            ],
            max_retries=2,
        )
        logger.info("Blog post generated successfully.")
        return response
    except Exception as e:
        logger.error(f"Error during blog post generation: {e}")
        return BlogPost(title="", content="")