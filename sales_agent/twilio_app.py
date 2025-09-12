from flask import Flask, request
from twilio.twiml.voice_response import VoiceResponse, Say
import asyncio
from sales_agent.calls.ai_closing_call import generate_gpt_response, text_to_speech_openvoice_bark
from sales_agent.utils.logger import logger

app = Flask(__name__)

@app.route("/voice", methods=['GET', 'POST'])
async def voice():
    response = VoiceResponse()
    try:
        # Generate a Gordon Gekko-inspired script for the call
        script_prompt = "Create a powerful opening script for a cold sales call. The prospect is a business decision-maker. Open with confidence, establish credibility, identify their biggest growth bottleneck, and position our AI sales automation as their competitive advantage. Create urgency around market timing. Keep it under 90 seconds and end with a strong call-to-action."
        gpt_script = await generate_gpt_response(script_prompt)
        
        if gpt_script:
            # Convert the script to speech
            # Note: In a real scenario, text_to_speech_openvoice_bark would return an audio URL or base64 encoded audio
            # For now, we'll use Twilio's <Say> verb with the text directly.
            # If text_to_speech_openvoice_bark were to return an audio URL, you'd use response.play(audio_url)
            response.say(gpt_script)
        else:
            response.say("I am sorry, I could not generate a script for this call.")

    except Exception as e:
        logger.error(f"Error in /voice endpoint: {e}", exc_info=True)
        response.say("An error occurred during the call.")

    return str(response)

if __name__ == "__main__":
    app.run(debug=True, port=5000)