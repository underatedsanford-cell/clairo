import os
from pathlib import Path

def load_system_prompt(default: str = "") -> str:
    """Loads the shared system prompt. Falls back to default if not found."""
    try:
        base_dir = Path(__file__).resolve().parent.parent
        prompt_path = base_dir / "prompts" / "system_prompt.txt"
        if prompt_path.exists():
            return prompt_path.read_text(encoding="utf-8").strip()
    except Exception:
        pass
    return default