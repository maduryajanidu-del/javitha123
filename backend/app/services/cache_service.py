"""
Redis cache service — used ONLY for temporary state, never as source of truth.
"""

import json
from typing import Optional
from app.db.redis_client import get_redis
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("cache_service")


class CacheService:
    """Redis cache operations for the dashboard and detection pipeline."""

    # ── Alert Cooldown ────────────────────────────────────────

    async def set_cooldown(self, track_id: str, ttl: int | None = None) -> bool:
        """Set a cooldown key for a track ID to prevent duplicate alerts."""
        try:
            r = await get_redis()
            key = f"alert:cooldown:{track_id}"
            ttl = ttl or settings.alert_cooldown_seconds
            await r.setex(key, ttl, "1")
            return True
        except Exception as e:
            logger.error(f"Failed to set cooldown: {e}")
            return False

    async def is_on_cooldown(self, track_id: str) -> bool:
        """Check if a track ID is still within cooldown."""
        try:
            r = await get_redis()
            key = f"alert:cooldown:{track_id}"
            return await r.exists(key) > 0
        except Exception as e:
            logger.error(f"Failed to check cooldown: {e}")
            return False

    # ── Camera Status ─────────────────────────────────────────

    async def set_camera_status(self, camera_id: str, status: str):
        """Update camera status in cache."""
        try:
            r = await get_redis()
            await r.set(f"camera:{camera_id}:status", status)
            if status == "online":
                from datetime import datetime, timezone
                await r.set(
                    f"camera:{camera_id}:last_seen",
                    datetime.now(timezone.utc).isoformat(),
                )
        except Exception as e:
            logger.error(f"Failed to set camera status: {e}")

    async def get_camera_status(self, camera_id: str) -> str:
        """Get camera status from cache."""
        try:
            r = await get_redis()
            status = await r.get(f"camera:{camera_id}:status")
            return status or "unknown"
        except Exception:
            return "unknown"

    # ── Recent Detections ─────────────────────────────────────

    async def push_recent_detection(self, detection: dict, max_items: int = 50):
        """Push a detection to the recent detections list."""
        try:
            r = await get_redis()
            key = "dashboard:recent_detections"
            await r.lpush(key, json.dumps(detection, default=str))
            await r.ltrim(key, 0, max_items - 1)
        except Exception as e:
            logger.error(f"Failed to push recent detection: {e}")

    async def get_recent_detections(self, limit: int = 20) -> list[dict]:
        """Get recent detections from cache."""
        try:
            r = await get_redis()
            key = "dashboard:recent_detections"
            items = await r.lrange(key, 0, limit - 1)
            return [json.loads(item) for item in items]
        except Exception as e:
            logger.error(f"Failed to get recent detections: {e}")
            return []

    # ── Dashboard Counters ────────────────────────────────────

    async def increment_counter(self, object_type: str):
        """Increment the daily counter for an object type."""
        try:
            r = await get_redis()
            from datetime import date
            key = f"stats:today:{date.today().isoformat()}:{object_type}"
            await r.incr(key)
            await r.expire(key, 86400 * 2)  # 2-day TTL
        except Exception as e:
            logger.error(f"Failed to increment counter: {e}")

    async def get_today_counts(self) -> dict:
        """Get all counters for today."""
        try:
            r = await get_redis()
            from datetime import date
            prefix = f"stats:today:{date.today().isoformat()}:"
            counts = {}
            async for key in r.scan_iter(f"{prefix}*"):
                obj_type = key.replace(prefix, "")
                val = await r.get(key)
                counts[obj_type] = int(val) if val else 0
            return counts
        except Exception as e:
            logger.error(f"Failed to get today counts: {e}")
            return {}
