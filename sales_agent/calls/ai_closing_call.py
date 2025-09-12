import os
import assemblyai as aai
import httpx
from openai import OpenAI
import asyncio
from ..config import DEEPSEEK_API_KEY, DEEPSEEK_API_BASE, ASSEMBLYAI_API_KEY, RECORDING_STATUS_CALLBACK_URL
from sales_agent.utils.logger import logger
from sales_agent.utils import load_system_prompt

# Gordon Gekko-inspired AI Sales Agent System Prompt for Voice Calls
VOICE_CALL_PERSONA = """You are a high-performance AI sales agent inspired by Gordon Gekko's persuasive charisma and Fortune 500 sales strategies. Your mission is to close high-value deals through voice calls with absolute confidence and strategic empathy.

Voice Call Approach:
- Open with confidence and establish immediate credibility
- Quickly identify the prospect's biggest pain point or growth opportunity
- Present your solution as the exclusive competitive advantage they need
- Create urgency without being pushy - emphasize market timing and competitive threats
- Handle objections with strategic reframing and value anchoring
- Move aggressively toward commitment and next steps

Communication Style for Calls:
- Speak with the confidence of a seasoned market operator
- Use strategic pauses and emphasis to build tension and urgency
- Blend hard data (ROI, competitive analysis) with emotional triggers (exclusivity, FOMO)
- Mirror the prospect's energy and communication style
- Position yourself as a trusted advisor, not just a salesperson

Key Phrases and Techniques:
- "The companies that are winning in your space are already leveraging this"
- "I'm curious - what's your biggest bottleneck in [relevant area] right now?"
- "Here's what I'm seeing with your competitors..."
- "The cost of waiting on this decision is actually higher than the investment"
- "I only work with companies that are serious about scaling aggressively"

Call Structure:
1. Confident opening with credibility establishment (30 seconds)
2. Pain point discovery with strategic questioning (2 minutes)
3. Solution presentation with competitive positioning (3 minutes)
4. Objection handling with value reframing (2 minutes)
5. Aggressive close with urgency and next steps (1 minute)

Remember: You're not selling a product, you're offering a competitive advantage that their competitors might already have. Make them feel like they're missing out on a game-changing opportunity."""

# Initialize AssemblyAI Client
try:
    aai.settings.api_key = ASSEMBLYAI_API_KEY
except Exception as e:
    logger.error(f"Failed to set AssemblyAI API key: {e}", exc_info=True)

# Initialize OpenAI Client
try:
    openai_client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_API_BASE, http_client=httpx.Client())
except Exception as e:
    logger.error(f"Failed to initialize OpenAI client: {e}", exc_info=True)
    openai_client = None

async def initiate_discord_call(user_id, channel_id):
    """Placeholder for initiating a Discord call."""
    logger.info(f"Attempting to initiate Discord call for user {user_id} in channel {channel_id}")
    # In a real implementation, this would interact with Discord API to start a call
    # This might involve creating a voice channel invite or moving a user to a voice channel
    return "discord_call_initiated_successfully"

async def transcribe_audio_assemblyai(audio_file_path):
    """Transcribes audio using AssemblyAI."""
    if not aai.settings.api_key:
        logger.error("AssemblyAI API key not set. Cannot transcribe audio.")
        return None
    try:
        transcriber = aai.Transcriber()
        transcript = await asyncio.to_thread(transcriber.transcribe, audio_file_path)
        return transcript.text
    except Exception as e:
        logger.error(f"Error transcribing audio with AssemblyAI: {e}", exc_info=True)
        return None

async def generate_gpt_response(prompt, conversation_history=None):
    """Generates a Gordon Gekko-inspired response using DeepSeek's GPT-4 model for closing calls."""
    if not openai_client:
        logger.error("DeepSeek client not initialized. Cannot generate GPT response.")
        return None
    
    messages = [{"role": "system", "content": VOICE_CALL_PERSONA}]
    if conversation_history:
        messages.extend(conversation_history)
    messages.append({"role": "user", "content": prompt})

    try:
        response = await openai_client.chat.completions.create(
            model="deepseek-chat", # Or deepseek-coder
            messages=messages,
            max_tokens=200,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error generating GPT response: {e}", exc_info=True)
        return None

async def text_to_speech_openvoice_bark(text):
    """Converts text to speech using OpenVoice or Bark (placeholder)."""
    # This would typically involve calling an external API or running a local model.
    # For demonstration, we'll just return a placeholder.
    print(f"Converting text to speech: '{text[:50]}...' (using placeholder)")
    # In a real implementation, you'd use a library like `elevenlabs` or `bark`
    # from elevenlabs import generate, play
    # audio = generate(text=text, voice="YOUR_VOICE_ID")
    # play(audio)
    return f"audio_data_for_{text}" # Placeholder for actual audio data


# Example Usage (for testing purposes, not part of main workflow)
if __name__ == "__main__":
    # Ensure you have TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, OPENAI_API_KEY set in config.py
    # and a TwiML Bin URL for trigger_twilio_call

    # Example: Transcribe audio
    # Dummy audio file for testing (replace with actual path)
    # dummy_audio_path = "path/to/your/audio.mp3"
    # if os.path.exists(dummy_audio_path):
    #     transcription = transcribe_audio_whisper(dummy_audio_path)
    #     print(f"Transcription: {transcription}")

    # Example: Generate GPT response
    # closing_script_prompt = "Follow this closing script: greet, uncover pain, present solution, handle objections, close for payment."
    # gpt_response = generate_gpt_response(closing_script_prompt)
    # print(f"GPT Response: {gpt_response}")

    # Example: Text to Speech
    # audio_output = text_to_speech_openvoice_bark("Hello, how can I help you today?")
    # print(f"Audio Output Placeholder: {audio_output}")
    async def main():
        # Example: Trigger Twilio call
        # Replace with the recipient's phone number (e.g., your number for testing)
        to_number = "+254738101905"  # Replace with the user's phone number
        call_sid = await trigger_twilio_call(to_number)
        if call_sid:
            print(f"Successfully initiated call with SID: {call_sid}")
        else:
            print("Failed to initiate call.")

    asyncio.run(main())
VOICE_CALL_PERSONA = load_system_prompt(VOICE_CALL_PERSONA)