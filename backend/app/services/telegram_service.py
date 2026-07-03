"""
Telegram Bot API service for sending photo alerts.
"""

import httpx
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("telegram_service")

TELEGRAM_API_BASE = "https://api.telegram.org/bot"


class TelegramService:
    """Sends alerts via the Telegram Bot API."""

    def __init__(self):
        self.token = settings.telegram_bot_token
        self.chat_id = settings.telegram_chat_id
        self.base_url = f"{TELEGRAM_API_BASE}{self.token}"

    async def send_photo_alert(
        self,
        image_bytes: bytes,
        caption: str,
        filename: str = "detection.jpg",
        max_retries: int = 3,
    ) -> bool:
        """
        Send a photo alert to the configured Telegram chat.
        Retries on transient failures.
        """
        if not self.token or not self.chat_id:
            logger.warning("Telegram credentials not configured — skipping alert")
            return False

        url = f"{self.base_url}/sendPhoto"

        for attempt in range(1, max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        url,
                        data={"chat_id": self.chat_id, "caption": caption, "parse_mode": "HTML"},
                        files={"photo": (filename, image_bytes, "image/jpeg")},
                    )

                    if response.status_code == 200:
                        logger.info("Telegram photo alert sent successfully")
                        return True
                    else:
                        logger.warning(
                            f"Telegram API error (attempt {attempt}): "
                            f"{response.status_code} — {response.text}"
                        )

            except Exception as e:
                logger.error(f"Telegram send failed (attempt {attempt}): {e}")

            # Exponential backoff
            if attempt < max_retries:
                import asyncio
                await asyncio.sleep(2 ** attempt)

        logger.error("Telegram photo alert failed after all retries")
        return False

    async def send_text_alert(self, text: str, max_retries: int = 3) -> bool:
        """Send a text-only alert (used for test alerts and non-photo notifications)."""
        if not self.token or not self.chat_id:
            logger.warning("Telegram credentials not configured — skipping alert")
            return False

        url = f"{self.base_url}/sendMessage"

        for attempt in range(1, max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(
                        url,
                        json={
                            "chat_id": self.chat_id,
                            "text": text,
                            "parse_mode": "HTML",
                        },
                    )
                    if response.status_code == 200:
                        logger.info("Telegram text alert sent")
                        return True
                    else:
                        logger.warning(f"Telegram text error: {response.status_code}")
            except Exception as e:
                logger.error(f"Telegram text send failed: {e}")

            if attempt < max_retries:
                import asyncio
                await asyncio.sleep(2 ** attempt)

        return False

    def format_detection_caption(
        self,
        object_type: str,
        confidence: float,
        camera_name: str,
        zone_name: str | None,
        severity: str,
        timestamp: str,
    ) -> str:
        """Format a detection alert caption for Telegram."""
        severity_emoji = {
            "low": "🟢",
            "normal": "🟡",
            "high": "🟠",
            "critical": "🔴",
        }
        emoji = severity_emoji.get(severity, "⚪")

        caption = (
            f"🚨 <b>RAILWAY ALERT</b>\n\n"
            f"<b>Object:</b> {object_type}\n"
            f"<b>Confidence:</b> {confidence:.0%}\n"
            f"<b>Camera:</b> {camera_name}\n"
        )
        if zone_name:
            caption += f"<b>Zone:</b> {zone_name}\n"
        caption += (
            f"<b>Severity:</b> {emoji} {severity.upper()}\n"
            f"<b>Time:</b> {timestamp}\n\n"
            f"<i>Smart Railway Detection System</i>"
        )
        return caption
