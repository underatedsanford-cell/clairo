from flask import Flask, request
import os
from sales_agent.outreach.discord_alerts import send_discord_alert
from sales_agent.utils.logger import logger

app = Flask(__name__)

@app.route('/twilio-recording-status', methods=['POST'])
def twilio_recording_status():
    try:
        # Twilio sends a POST request with recording details
        recording_url = request.form.get('RecordingUrl')
        call_sid = request.form.get('CallSid')
        recording_status = request.form.get('RecordingStatus')

        logger.info(f"Received recording status update for Call SID {call_sid}: {recording_status}")

        if recording_status == 'completed' and recording_url:
            message = f"Call recording for Call SID {call_sid} is available: {recording_url}"
            logger.info(message)
            send_discord_alert(message)

        return "", 200
    except Exception as e:
        logger.error(f"Error handling Twilio recording status callback: {e}", exc_info=True)
        return "", 500

if __name__ == '__main__':
    # This is for local testing. In production, use a WSGI server like Gunicorn or uWSGI.
    # Ensure your ngrok or similar tunnel is pointing to this port.
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)