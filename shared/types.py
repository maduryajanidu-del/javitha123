"""
Shared type definitions for the Smart Railway Detection System.
"""

from typing import TypedDict, Optional


class CameraDict(TypedDict):
    id: str
    name: str
    location: Optional[str]
    stream_url: str
    status: str
    last_seen_at: Optional[str]


class DetectionDict(TypedDict):
    id: str
    camera_id: Optional[str]
    track_id: Optional[str]
    object_type: str
    confidence: float
    image_url: Optional[str]
    frame_timestamp: Optional[str]
    event_timestamp: str
    zone_name: Optional[str]
    severity: str
    alert_sent: bool
    alert_count: int


class AlertDict(TypedDict):
    id: str
    detection_id: str
    channel: str
    status: str
    sent_at: Optional[str]
    retry_count: int


class WebSocketMessageDict(TypedDict):
    type: str
    data: dict
