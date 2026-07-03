"""
Deduplication logic — stable frame count + cooldown to prevent duplicate alerts.
"""

import time
import logging
from typing import Optional

from ai.config import config
from ai.tracker.byte_tracker import TrackedObject

logger = logging.getLogger("railway.dedup")


class DeduplicationFilter:
    """
    Ensures each tracked object triggers at most one alert per cooldown window.

    Rules:
    1. An object must be detected in N consecutive frames (stable_frame_count).
    2. After alert, a cooldown key prevents re-alerting for the same track.
    3. Critical objects can bypass cooldown if severity changes.
    """

    def __init__(self):
        self.stable_frame_count = config.STABLE_FRAME_COUNT
        self.cooldown_seconds = config.ALERT_COOLDOWN_SECONDS

        # track_key -> count of consecutive frames
        self._frame_counts: dict[str, int] = {}

        # track_key -> timestamp of last alert
        self._last_alert_time: dict[str, float] = {}

        # track_key -> last severity
        self._last_severity: dict[str, str] = {}

    def check(self, tracked: TrackedObject, severity: str) -> bool:
        """
        Check if a tracked object should trigger an event.
        Returns True if the object passes all dedup checks.
        """
        key = tracked.track_key

        # 1. Increment frame count
        self._frame_counts[key] = self._frame_counts.get(key, 0) + 1

        # 2. Check stable frame requirement
        if self._frame_counts[key] < self.stable_frame_count:
            return False

        # 3. Check cooldown
        last_time = self._last_alert_time.get(key)
        if last_time is not None:
            elapsed = time.time() - last_time
            if elapsed < self.cooldown_seconds:
                # Allow re-alert if severity escalated
                old_severity = self._last_severity.get(key, "low")
                severity_order = {"low": 0, "normal": 1, "high": 2, "critical": 3}
                if severity_order.get(severity, 0) <= severity_order.get(old_severity, 0):
                    return False

        return True

    def mark_alerted(self, tracked: TrackedObject, severity: str):
        """Mark that an alert was sent for this tracked object."""
        key = tracked.track_key
        self._last_alert_time[key] = time.time()
        self._last_severity[key] = severity
        # Reset frame count after alert
        self._frame_counts[key] = 0

    def clear_stale(self, max_age: float = 120.0):
        """Remove entries for tracks that haven't been seen recently."""
        now = time.time()
        stale_keys = [
            k for k, t in self._last_alert_time.items()
            if now - t > max_age
        ]
        for k in stale_keys:
            self._frame_counts.pop(k, None)
            self._last_alert_time.pop(k, None)
            self._last_severity.pop(k, None)

    def reset_track(self, track_key: str):
        """Remove the frame count for a track that disappeared."""
        self._frame_counts.pop(track_key, None)
