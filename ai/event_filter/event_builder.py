"""
Event builder — constructs confirmed detection event objects.
"""

import logging
from datetime import datetime, timezone
from uuid import uuid4
from typing import Optional

from ai.tracker.byte_tracker import TrackedObject

logger = logging.getLogger("railway.event_builder")


class DetectionEvent:
    """A confirmed detection event ready for storage and alerting."""

    def __init__(
        self,
        event_id: str,
        camera_id: str,
        track_id: str,
        object_type: str,
        confidence: float,
        severity: str,
        bbox: tuple[int, int, int, int],
        frame_timestamp: datetime,
        zone_name: Optional[str] = None,
    ):
        self.event_id = event_id
        self.camera_id = camera_id
        self.track_id = track_id
        self.object_type = object_type
        self.confidence = confidence
        self.severity = severity
        self.bbox = bbox
        self.frame_timestamp = frame_timestamp
        self.event_timestamp = datetime.now(timezone.utc)
        self.zone_name = zone_name
        self.image_url: Optional[str] = None
        self.alert_sent: bool = False

    def to_dict(self) -> dict:
        """Convert to a dictionary for API submission."""
        return {
            "camera_id": self.camera_id,
            "track_id": self.track_id,
            "object_type": self.object_type,
            "confidence": round(self.confidence, 4),
            "image_url": self.image_url,
            "frame_timestamp": self.frame_timestamp.isoformat(),
            "event_timestamp": self.event_timestamp.isoformat(),
            "zone_name": self.zone_name,
            "severity": self.severity,
            "alert_sent": self.alert_sent,
            "alert_count": 1 if self.alert_sent else 0,
        }

    def __repr__(self):
        return (
            f"Event({self.object_type}, severity={self.severity}, "
            f"track={self.track_id}, conf={self.confidence:.2f})"
        )


class EventBuilder:
    """Builds DetectionEvent objects from confirmed tracked detections."""

    def __init__(self, camera_id: str = "default", zone_name: Optional[str] = None):
        self.camera_id = camera_id
        self.zone_name = zone_name

    def build(
        self,
        tracked: TrackedObject,
        severity: str,
        frame_timestamp: Optional[datetime] = None,
    ) -> DetectionEvent:
        """Create a detection event from a tracked object."""
        return DetectionEvent(
            event_id=str(uuid4()),
            camera_id=self.camera_id,
            track_id=tracked.track_key,
            object_type=tracked.class_name,
            confidence=tracked.confidence,
            severity=severity,
            bbox=tracked.bbox,
            frame_timestamp=frame_timestamp or datetime.now(timezone.utc),
            zone_name=self.zone_name,
        )
