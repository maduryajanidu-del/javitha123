"""
AI inference service configuration.
"""

import os
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_env = os.path.join(current_dir, "..", "backend", ".env")
load_dotenv(backend_env)
load_dotenv()  # Also check local .env


class AIConfig:
    """Configuration for the AI detection pipeline."""

    # Camera — Laptop Webcam only
    WEBCAM_INDEX: int = int(os.getenv("WEBCAM_INDEX", "0"))

    # Model
    YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", "yolo11n.pt")
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.6"))

    # Processing
    PROCESS_EVERY_N_FRAMES: int = int(os.getenv("PROCESS_EVERY_N_FRAMES", "2"))
    STABLE_FRAME_COUNT: int = int(os.getenv("STABLE_FRAME_COUNT", "3"))
    INPUT_RESOLUTION: tuple[int, int] = (640, 480)

    # Deduplication
    ALERT_COOLDOWN_SECONDS: int = int(os.getenv("ALERT_COOLDOWN_SECONDS", "10"))

    # Relevant COCO classes for railway monitoring
    RELEVANT_CLASSES: list[str] = [
        "person", "bicycle", "car", "motorcycle", "bus", "truck",
        "cat", "dog", "horse", "cow", "sheep",
    ]

    # Severity mapping — objects that are critical in railway zones
    CRITICAL_OBJECTS: list[str] = ["person", "car", "truck", "bus"]
    HIGH_SEVERITY_OBJECTS: list[str] = ["motorcycle", "bicycle", "dog"]

    # Backend API
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")

    # Supabase (for direct uploads)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_STORAGE_BUCKET: str = os.getenv("SUPABASE_STORAGE_BUCKET", "detections")

    # Telegram
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Camera reconnection
    RECONNECT_DELAY: int = 5  # seconds
    MAX_RECONNECT_ATTEMPTS: int = 50


config = AIConfig()
