"""
Telegram notifier — sends photo alerts asynchronously.
"""

import logging
import httpx
from typing import Optional

from ai.config import config
from ai.event_filter.event_builder import DetectionEvent

logger = logging.getLogger("railway.telegram_notifier")

TELEGRAM_API_BASE = "https://api.telegram.org/bot"


class TelegramNotifier:
    """Sends detection alerts via the Telegram Bot API."""

    def __init__(self):
        self.token = config.TELEGRAM_BOT_TOKEN
        self.chat_id = config.TELEGRAM_CHAT_ID
        self.base_url = f"{TELEGRAM_API_BASE}{self.token}"

    @property
    def is_configured(self) -> bool:
        return bool(self.token and self.chat_id)

    async def send_alert(
        self,
        event: DetectionEvent,
        image_bytes: Optional[bytes] = None,
        camera_name: str = "Unknown Camera",
        max_retries: int = 3,
    ) -> bool:
        """Send a photo alert for a detection event."""
        if not self.is_configured:
            logger.warning("Telegram not configured — skipping alert")
            return False

        caption = self._format_caption(event, camera_name)

        for attempt in range(1, max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    if image_bytes:
                        response = await client.post(
                            f"{self.base_url}/sendPhoto",
                            data={"chat_id": self.chat_id, "caption": caption, "parse_mode": "HTML"},
                            files={"photo": ("detection.jpg", image_bytes, "image/jpeg")},
                        )
                    else:
                        response = await client.post(
                            f"{self.base_url}/sendMessage",
                            json={"chat_id": self.chat_id, "text": caption, "parse_mode": "HTML"},
                        )

                    if response.status_code == 200:
                        logger.info(f"📱 Telegram alert sent for {event.object_type}")
                        return True
                    else:
                        logger.warning(f"Telegram error (attempt {attempt}): {response.text}")

            except Exception as e:
                logger.error(f"Telegram send failed (attempt {attempt}): {e}")

            if attempt < max_retries:
                import asyncio
                await asyncio.sleep(2 ** attempt)

        logger.error("Telegram alert failed after all retries")
        return False

    def _format_caption(self, event: DetectionEvent, camera_name: str) -> str:
        """Format the alert caption."""
        severity_emoji = {
            "low": "🟢", "normal": "🟡", "high": "🟠", "critical": "🔴",
        }
        emoji = severity_emoji.get(event.severity, "⚪")

        caption = (
            f"🚨 <b>RAILWAY ALERT</b>\n\n"
            f"<b>Object:</b> {event.object_type.title()}\n"
            f"<b>Confidence:</b> {event.confidence:.0%}\n"
            f"<b>Camera:</b> {camera_name}\n"
        )
        if event.zone_name:
            caption += f"<b>Zone:</b> {event.zone_name}\n"
        caption += (
            f"<b>Severity:</b> {emoji} {event.severity.upper()}\n"
            f"<b>Time:</b> {event.event_timestamp.strftime('%Y-%m-%d %H:%M:%S')}\n\n"
            f"<i>Smart Railway Detection System</i>"
        )
        return caption
