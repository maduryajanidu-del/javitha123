"""
Structured logging utility for the Smart Railway system.
Handles Windows encoding issues by using UTF-8 output.
"""

import logging
import sys
import io
from typing import Optional


def get_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    """Create a structured logger for a service module."""
    logger = logging.getLogger(f"railway.{name}")

    if not logger.handlers:
        # Use UTF-8 encoding for stdout to handle emoji/unicode on Windows
        stream = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace", line_buffering=True)
        handler = logging.StreamHandler(stream)
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(level)

    return logger
