import logging
import os
from logging.handlers import RotatingFileHandler


def setup_logging():
    # Configure root logger once
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    # Ensure a console handler exists
    has_stream = any(isinstance(h, logging.StreamHandler) for h in root_logger.handlers)
    if not has_stream:
        stream_handler = logging.StreamHandler()
        stream_handler.setFormatter(formatter)
        root_logger.addHandler(stream_handler)

    # Ensure a rotating file handler exists
    has_file = any(isinstance(h, RotatingFileHandler) or isinstance(h, logging.FileHandler) for h in root_logger.handlers)
    if not has_file:
        try:
            # Compute repo root and log file path
            repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            log_path = os.path.join(repo_root, 'discord_bot.log')
            file_handler = RotatingFileHandler(log_path, maxBytes=5 * 1024 * 1024, backupCount=3, encoding='utf-8')
            file_handler.setFormatter(formatter)
            root_logger.addHandler(file_handler)
        except Exception:
            # If anything goes wrong, continue with console-only logging
            pass

    return logging.getLogger(__name__)


logger = setup_logging()