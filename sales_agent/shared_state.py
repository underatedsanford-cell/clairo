import asyncio
import uuid
import json
import os
import logging
from collections import deque
from datetime import datetime

# Dictionary to store asyncio.Event objects for approvals
# Key format: (lead_name, action_type)
approval_events = {}

# Dictionary to store task runs with unique IDs
# Key: run_id (UUID), Value: dict with run details
task_runs = {}

sales_agent_status = {
    "last_update": "",
    "new_leads_added": 0,
    "outreach_sent_count": 0,
    "replies_received_count": 0,
    "calls_booked_count": 0,
    "deals_closed_count": 0,
    "total_pipeline_value": 0,
    "follow_ups_scheduled_count": 0,
    "booked_calls_list": []
}

class RecentLeadsStorage:
    def __init__(self, max_size=100):
        self.leads = deque(maxlen=max_size)

    def add_lead(self, lead_data):
        self.leads.append(lead_data)

    def get_all(self):
        return list(self.leads)

recent_leads_storage = RecentLeadsStorage()


async def get_approval_event(lead_name: str, action_type: str):
    key = (lead_name, action_type)
    if key not in approval_events:
        approval_events[key] = asyncio.Event()
    return approval_events[key]

def set_approval_event(lead_name: str, action_type: str):
    key = (lead_name, action_type)
    if key in approval_events:
        approval_events[key].set()
        # Optionally remove it after setting if it's a one-time approval
        # del approval_events[key]

STATUS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'status.json')

def save_state():
    """Save the current state to the status file."""
    with open(STATUS_FILE, 'w') as f:
        json.dump({
            'task_runs': task_runs,
            'sales_agent_status': sales_agent_status,
        }, f, indent=2)

def load_state():
    """Load the state from the status file."""
    global task_runs, sales_agent_status
    if os.path.exists(STATUS_FILE):
        with open(STATUS_FILE, 'r') as f:
            state = json.load(f)
            task_runs = state.get('task_runs', {})
            sales_agent_status = state.get('sales_agent_status', sales_agent_status)

def create_task_run(command_name: str, user_id: str, parameters: dict = None):
    """Create a new task run and return its ID"""
    run_id = str(uuid.uuid4())
    task_runs[run_id] = {
        "id": run_id,
        "command": command_name,
        "user_id": user_id,
        "parameters": parameters or {},
        "status": "pending",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "results": {},
        "logs": [],
        "approval_required": False,
        "approved": False,
        "error": None
    }
    save_state()
    return run_id

def update_task_run(run_id: str, **updates):
    """Update a task run with new data"""
    if run_id in task_runs:
        task_runs[run_id].update(updates)
        task_runs[run_id]["updated_at"] = datetime.now().isoformat()
        save_state()

def get_task_run(run_id: str):
    """Get a task run by ID"""
    load_state()
    return task_runs.get(run_id)

def get_all_task_runs():
    """Get all task runs"""
    load_state()
    return list(task_runs.values())

def add_log_to_run(run_id: str, message: str):
    """Add a log message to a task run"""
    if run_id in task_runs:
        task_runs[run_id]["logs"].append({
            "timestamp": datetime.now().isoformat(),
            "message": message
        })
        task_runs[run_id]["updated_at"] = datetime.now().isoformat()
        save_state()