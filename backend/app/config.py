"""
Application configuration loaded from environment variables.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    # ── Supabase ──
    supabase_url: str = Field(default="")
    supabase_anon_key: str = Field(default="")
    supabase_service_role_key: str = Field(default="")
    supabase_storage_bucket: str = Field(default="detections")

    # ── Redis ──
    redis_url: str = Field(default="redis://localhost:6379/0")

    # ── Telegram ──
    telegram_bot_token: str = Field(default="")
    telegram_chat_id: str = Field(default="")

    # ── Camera ──
    camera_stream_url: str = Field(default="http://192.168.1.100:81/stream")

    # ── AI Model ──
    yolo_model_path: str = Field(default="yolo11n.pt")
    confidence_threshold: float = Field(default=0.6)
    alert_cooldown_seconds: int = Field(default=10)
    stable_frame_count: int = Field(default=3)
    process_every_n_frames: int = Field(default=2)

    # ── Server ──
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)
    debug: bool = Field(default=True)

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
