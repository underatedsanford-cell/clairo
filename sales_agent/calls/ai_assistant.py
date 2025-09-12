import asyncio
from openai import OpenAI
from sales_agent.config import OPENAI_API_KEY
from sales_agent.utils.logger import logger
import instructor
from pydantic import BaseModel, Field
from typing import Literal

client = instructor.patch(OpenAI(api_key=OPENAI_API_KEY))


class CalendarAction(BaseModel):
    action: Literal["schedule", "reschedule", "cancel", "inform"]
    confirmation: bool = Field(
        ...,
        description="Confirm with the user before making any changes to the calendar.",
    )

async def get_calendar_action(user_message: str) -> CalendarAction:
    """DetermTines the user's intent to schedule, reschedule, cancel, or provide information."""
    try:
        return client.chat.completions.create(
            model="gpt-4-turbo",
            response_model=CalendarAction,
            messages=[
                {
                    "role": "system",
                    "content": "You are a world-class AI assistant for scheduling appointments. Your role is to understand the user's intent and confirm any actions before they are taken.",
                },
                {
                    "role": "user",
                    "content": user_message,
                },
            ],
        )
    except Exception as e:
        logger.error(f"Error getting calendar action: {e}")
        return CalendarAction(action="inform", confirmation=False)


async def chat_with_assistant(initial_message, user_id):
    """Manages an interactive chat session with the user."""
    conversation_history = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": initial_message}
    ]

    while True:
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=conversation_history
            )

            assistant_message = response.choices[0].message.content
            conversation_history.append({"role": "assistant", "content": assistant_message})

            # In a real implementation, you would send this message back to the user.
            # For now, we'll just return it.
            return assistant_message

        except Exception as e:
            print(f"An error occurred: {e}")
            return "I'm sorry, I encountered an error. Please try again."