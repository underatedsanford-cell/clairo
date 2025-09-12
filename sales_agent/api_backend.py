from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio
import json
import sys
import os
import subprocess
import time
import signal
from datetime import datetime

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sales_agent.outreach.gpt_script_generation import generate_outreach_script
from sales_agent.outreach.gmail_smtp import send_email
from sales_agent.utils.email_verification import verify_email_with_abstractapi

from sales_agent.leads.google_sheets import GoogleSheet
from sales_agent.leads.enrichment import enrich_lead_data
from sales_agent.config import GOOGLE_SHEET_ID, GOOGLE_SHEETS_CREDENTIALS_PATH
from sales_agent.utils.logger import logger
from sales_agent.shared_state import get_task_run, get_all_task_runs, update_task_run, create_task_run, add_log_to_run
# New import for real-time lead finding
from sales_agent.leads.realtime_finder import find_leads_realtime
import threading
try:
    from jitsi_plus_plugin.integrations.flask import init_jitsi_plus
    JITSI_AVAILABLE = True
except ImportError:
    JITSI_AVAILABLE = False
    logger.warning("jitsi_plus_plugin not found - video call features disabled")

app = Flask(__name__)
CORS(app)  # Enable CORS for the Next.js frontend

if JITSI_AVAILABLE:
    jitsi_plus = init_jitsi_plus(app, {
        "jitsi": {
            "server_url": "https://meet.jit.si"
        }
    })
else:
    jitsi_plus = None

# Global Google Sheets instance
google_sheet = GoogleSheet(GOOGLE_SHEET_ID, GOOGLE_SHEETS_CREDENTIALS_PATH)

@app.route('/', methods=['GET'])
def welcome():
    """Welcome page for the root route"""
    return jsonify({
        "message": "Welcome to Dyna API",
        "status": "running",
        "available_endpoints": [
            "/api/health",
            "/api/send-email",
            "/api/verify-email",
            "/api/find-leads",
            "/api/bulk-outreach",
            "/api/leads",
            "/api/lead-score",
            "/api/dashboard",
            "/api/competitors",
            "/api/export-spreadsheet",
            "/api/task-runs",
            "/api/task-runs/<run_id>",
            "/api/approve-task/<run_id>",
            "/api/bot/start",
            "/api/bot/status"
        ]
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Dyna API is running"})

@app.route('/api/task-runs', methods=['GET'])
def get_task_runs_api():
    """Get all task runs"""
    try:
        runs = get_all_task_runs()
        return jsonify({
            "success": True,
            "task_runs": runs,
            "count": len(runs)
        })
    except Exception as e:
        logger.error(f"Error in get_task_runs_api: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/task-runs', methods=['POST'])
def create_task_run_api():
    """Create a new task run"""
    try:
        data = request.get_json()
        command = data.get('command', 'unknown')
        user_id = data.get('user_id', 'unknown')
        parameters = data.get('parameters', {})
        log = data.get('log', '')
        run = create_task_run(command, user_id, parameters, log)
        return jsonify({"success": True, "task_run": run})
    except Exception as e:
        logger.error(f"Error in create_task_run_api: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/task-runs/<run_id>', methods=['GET'])
def get_task_run_api(run_id):
    """Get a specific task run by ID"""
    try:
        run = get_task_run(run_id)
        if run:
            return jsonify({"success": True, "task_run": run})
        else:
            return jsonify({"success": False, "error": "Task run not found"}), 404
    except Exception as e:
        logger.error(f"Error in get_task_run_api: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/approve-task/<run_id>', methods=['POST'])
def approve_task_api(run_id):
    """Approve a task run"""
    try:
        update_task_run(run_id, approved=True)
        add_log_to_run(run_id, "Task was approved via API")
        return jsonify({"success": True, "run_id": run_id})
    except Exception as e:
        logger.error(f"Error in approve_task_api: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/send-email', methods=['POST'])
def send_email_api():
    """Send an email using SMTP"""
    try:
        data = request.get_json()
        to_email = data.get('to_email')
        subject = data.get('subject')
        body = data.get('body')
        result = send_email(to_email, subject, body)
        return jsonify({"success": True, "result": result})
    except Exception as e:
        logger.error(f"Error in send_email_api: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/verify-email', methods=['POST'])
def verify_email_api():
    """Verify an email address using AbstractAPI"""
    try:
        data = request.get_json()
        email = data.get('email')
        result = verify_email_with_abstractapi(email)
        return jsonify({"success": True, "result": result})
    except Exception as e:
        logger.error(f"Error in verify_email_api: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/find-leads', methods=['POST'])
def find_leads_api():
    """Find leads based on criteria"""
    try:
        data = request.get_json()
        criteria = data.get('criteria', {})
        results = google_sheet.find_leads(criteria)
        return jsonify({"success": True, "results": results})
    except Exception as e:
        logger.error(f"Error in find_leads_api: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/bulk-outreach', methods=['POST'])
def bulk_outreach_api():
    """Send outreach emails in bulk"""
    try:
        data = request.get_json()
        leads = data.get('leads', [])
        subject = data.get('subject', 'Introducing our AI-powered sales solution')
        body_template = data.get('body_template', 'Hi {name},\n\nWe have an exciting AI solution...')
        successes = 0
        failures = 0
        for lead in leads:
            try:
                personalized_body = body_template.format(name=lead.get('name', 'there'))
                send_email(lead['email'], subject, personalized_body)
                successes += 1
            except Exception:
                failures += 1
        return jsonify({"success": True, "sent": successes, "failed": failures})
    except Exception as e:
        logger.error(f"Error in bulk_outreach_api: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/leads', methods=['GET'])
def get_leads_api():
    """Get leads from Google Sheets"""
    try:
        leads = google_sheet.get_leads()
        return jsonify({"success": True, "leads": leads})
    except Exception as e:
        logger.error(f"Error in get_leads_api: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/lead-score', methods=['POST'])
def lead_score_api():
    """Calculate lead score"""
    try:
        data = request.get_json()
        lead = data.get('lead', {})
        score = google_sheet.calculate_lead_score(lead)
        return jsonify({"success": True, "score": score})
    except Exception as e:
        logger.error(f"Error in lead_score_api: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard', methods=['GET'])
def dashboard_api():
    """Get dashboard data"""
    try:
        data = {
            "total_leads": google_sheet.get_total_leads(),
            "active_campaigns": google_sheet.get_active_campaigns(),
            "conversion_rate": google_sheet.get_conversion_rate(),
        }
        return jsonify({"success": True, "data": data})
    except Exception as e:
        logger.error(f"Error in dashboard_api: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/competitors', methods=['GET'])
def competitors_api():
    """Get competitor analysis data"""
    try:
        competitors = google_sheet.get_competitors()
        return jsonify({"success": True, "competitors": competitors})
    except Exception as e:
        logger.error(f"Error in competitors_api: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/export-spreadsheet', methods=['POST'])
def export_spreadsheet_api():
    """Export data in spreadsheet format"""
    try:
        data = request.get_json()
        data_type = data.get('type', 'leads')
        
        if data_type == 'leads':
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            leads = loop.run_until_complete(google_sheet.read_leads())
            loop.close()
            
            # Format for spreadsheet export
            spreadsheet_data = {
                "headers": ["Lead Name", "Company", "Email", "Status", "Lead Score", "Outreach Status"],
                "rows": []
            }
            
            for lead in leads:
                row = [
                    lead.get('Lead Name', ''),
                    lead.get('Company', ''),
                    lead.get('Email', ''),
                    lead.get('Status', ''),
                    lead.get('Lead Score', 0),
                    lead.get('Outreach Status', '')
                ]
                spreadsheet_data["rows"].append(row)
            
            return jsonify({
                "success": True,
                "data": spreadsheet_data,
                "total_rows": len(spreadsheet_data["rows"])
            })
    except Exception as e:
        logger.error(f"Error in export_spreadsheet_api: {e}")
        return jsonify({"error": str(e)}), 500

# === Discord Bot Control Endpoints ===

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PID_FILE = os.path.join(REPO_ROOT, 'discord_bot.pid')
RUN_BOT_PS1 = os.path.join(REPO_ROOT, 'run_bot.ps1')
LAST_START_FILE = os.path.join(REPO_ROOT, 'discord_bot_last_start.txt')

# Define Python executable and Discord bot path for spawning the bot process
PYTHON_EXE = sys.executable
DISCORD_BOT_PATH = os.path.join(REPO_ROOT, 'sales_agent', 'discord_bot.py')

def _is_pid_running(pid: int) -> bool:
    try:
        # On Windows, os.kill with signal 0 is not supported; use tasklist check via subprocess
        if os.name == "nt":
            # Using 'tasklist' to check process existence
            out = subprocess.run(["tasklist", "/FI", f"PID eq {pid}"], capture_output=True, text=True)
            return str(pid) in out.stdout
        else:
            os.kill(pid, 0)
            return True
    except Exception:
        return False


def _get_bot_status():
    info = {"running": False}
    if os.path.exists(PID_FILE):
        try:
            with open(PID_FILE, "r") as f:
                pid_str = f.read().strip()
            if pid_str:
                pid = int(pid_str)
                info["pid"] = pid
                info["running"] = _is_pid_running(pid)
        except Exception as e:
            info["error"] = str(e)
    # Attach last start timestamp if present
    try:
        if os.path.exists(LAST_START_FILE):
            with open(LAST_START_FILE, "r") as lf:
                ts = lf.read().strip()
                if ts:
                    info["lastStart"] = ts
    except Exception:
        pass
    return info


@app.route("/api/bot/status", methods=["GET"])
def bot_status_api():
    info = _get_bot_status()
    info["success"] = True
    return jsonify(info)


@app.route("/api/bot/start", methods=["POST"])
def bot_start_api():
    info = _get_bot_status()
    if info.get("running"):
        return jsonify({"success": True, "message": "Bot already running", "pid": info.get("pid"), "lastStart": info.get("lastStart")})

    env = os.environ.copy()
    # Ensure .env is loaded by discord_bot.py if needed; here we just pass env through
    try:
        # Spawn the bot directly
        proc = subprocess.Popen([PYTHON_EXE, DISCORD_BOT_PATH], env=env, cwd=os.path.dirname(DISCORD_BOT_PATH))
        pid = proc.pid
        # Persist PID
        with open(PID_FILE, "w") as f:
            f.write(str(pid))
        # Persist last start timestamp (ISO format)
        try:
            with open(LAST_START_FILE, "w") as lf:
                lf.write(datetime.now().isoformat())
        except Exception:
            pass
        return jsonify({"success": True, "message": "Bot starting", "pid": pid, "lastStart": datetime.now().isoformat()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/bot/stop", methods=["POST"])
def bot_stop_api():
    # Try to read PID
    if not os.path.exists(PID_FILE):
        return jsonify({"success": True, "message": "No PID file; bot likely not running"})

    try:
        with open(PID_FILE, "r") as f:
            pid_str = f.read().strip()
        if not pid_str:
            return jsonify({"success": True, "message": "PID file empty; bot likely not running"})
        pid = int(pid_str)
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed reading PID file: {e}"}), 500

    # Attempt graceful termination
    try:
        if os.name == "nt":
            subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], check=False)
        else:
            os.kill(pid, signal.SIGTERM)
        time.sleep(0.5)
    except Exception as e:
        # Continue to cleanup even if kill fails
        pass

    running = _is_pid_running(pid)

    # Cleanup PID file if process is not running anymore
    if not running and os.path.exists(PID_FILE):
        try:
            os.remove(PID_FILE)
        except Exception:
            pass

    return jsonify({
        "success": True,
        "message": "Stop signal sent" if running else "Bot stopped",
        "running": running
    })


@app.route("/api/bot/health", methods=["GET"])
def bot_health_api():
    info = _get_bot_status()
    running = bool(info.get("running"))
    return jsonify({
        "success": True,
        "ok": running,
        "running": running,
        "pid": info.get("pid"),
        "lastStart": info.get("lastStart")
    })

@app.route('/api/realtime-leads/start', methods=['POST'])
def start_realtime_leads():
    """Start a 10-minute real-time lead search in the background and return a run_id for polling."""
    try:
        data = request.get_json(force=True) or {}
        niche = data.get('niche') or data.get('target_audience')
        location = data.get('location')
        desired_count = int(data.get('count') or data.get('desired_count') or 10)
        channels = data.get('preferred_channels') or data.get('channels') or []
        if not isinstance(channels, list):
            channels = []
        channels = [c.lower() for c in channels if c]
        # allow only supported channels
        supported = {'whatsapp', 'email', 'phone'}
        channels = [c for c in channels if c in supported]
        if not channels:
            # default to email + whatsapp if nothing provided
            channels = ['email', 'whatsapp']

        if not niche:
            return jsonify({"success": False, "error": "Missing 'niche'"}), 400

        run_id = create_task_run(
            command_name="realtime_leads",
            user_id=data.get('user_id', 'web'),
            parameters={
                "niche": niche,
                "location": location,
                "desired_count": desired_count,
                "preferred_channels": channels
            }
        )
        update_task_run(run_id, status="running", results={"leads": [], "count": 0})
        add_log_to_run(run_id, f"Real-time search started for niche='{niche}', location='{location}', channels={channels}, desired_count={desired_count}")

        def _runner():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                leads = loop.run_until_complete(find_leads_realtime(
                    niche=niche,
                    location=location,
                    desired_count=desired_count,
                    preferred_channels=channels,
                    time_limit_seconds=600
                ))
                # Final update
                update_task_run(run_id, status="completed", results={"leads": leads, "count": len(leads)})
                add_log_to_run(run_id, f"Search completed with {len(leads)} leads")
            except Exception as e:
                logger.error(f"Realtime leads runner error: {e}", exc_info=True)
                update_task_run(run_id, status="failed", error=str(e))
                add_log_to_run(run_id, f"Error: {e}")
            finally:
                loop.close()

        t = threading.Thread(target=_runner, daemon=True)
        t.start()

        return jsonify({"success": True, "run_id": run_id})
    except Exception as e:
        logger.error(f"Error in start_realtime_leads: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/realtime-leads/status/<run_id>', methods=['GET'])
def realtime_leads_status(run_id):
    """Get the current status and results (so far) for a given real-time leads run."""
    try:
        run = get_task_run(run_id)
        if not run:
            return jsonify({"success": False, "error": "run_id not found"}), 404
        # Compute elapsed seconds from created_at
        created_at = run.get('created_at')
        elapsed_seconds = None
        try:
            if created_at:
                dt = datetime.fromisoformat(created_at)
                elapsed_seconds = int((datetime.now() - dt).total_seconds())
        except Exception:
            pass
        return jsonify({
            "success": True,
            "run_id": run_id,
            "status": run.get('status'),
            "parameters": run.get('parameters', {}),
            "results": run.get('results', {}),
            "logs": run.get('logs', [])[-50:],
            "elapsed_seconds": elapsed_seconds
        })
    except Exception as e:
        logger.error(f"Error in realtime_leads_status: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/status', methods=['GET'])
def get_status_api():
    """Get the content of status.json"""
    try:
        status_file_path = os.path.join(REPO_ROOT, 'status.json')
        if os.path.exists(status_file_path):
            with open(status_file_path, 'r') as f:
                status_data = json.load(f)
            return jsonify({"success": True, "data": status_data})
        else:
            return jsonify({"success": False, "error": "status.json not found"}), 404
    except Exception as e:
        logger.error(f"Error in get_status_api: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5001)