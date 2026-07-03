"""
Pydantic models for database entities.
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID, uuid4


# ── Camera ────────────────────────────────────────────────────

class CameraBase(BaseModel):
    name: str
    location: Optional[str] = None
    stream_url: str
    status: Literal["online", "offline", "error"] = "offline"


class CameraCreate(CameraBase):
    pass


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    stream_url: Optional[str] = None
    status: Optional[Literal["online", "offline", "error"]] = None


class Camera(CameraBase):
    id: UUID
    last_seen_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Detection ─────────────────────────────────────────────────

class DetectionBase(BaseModel):
    camera_id: Optional[UUID] = None
    track_id: Optional[str] = None
    object_type: str
    confidence: float
    image_url: Optional[str] = None
    frame_timestamp: Optional[datetime] = None
    zone_name: Optional[str] = None
    severity: Literal["low", "normal", "high", "critical"] = "normal"
    notes: Optional[str] = None


class DetectionCreate(DetectionBase):
    pass


class Detection(DetectionBase):
    id: UUID
    event_timestamp: datetime
    alert_sent: bool = False
    alert_count: int = 0

    model_config = {"from_attributes": True}


# ── Alert ─────────────────────────────────────────────────────

class AlertBase(BaseModel):
    detection_id: UUID
    channel: Literal["telegram", "email", "sms"] = "telegram"
    status: Literal["pending", "sent", "acknowledged", "resolved", "failed"] = "pending"


class AlertCreate(AlertBase):
    pass


class Alert(AlertBase):
    id: UUID
    sent_at: Optional[datetime] = None
    retry_count: int = 0
    response_payload: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── System Log ────────────────────────────────────────────────

class SystemLogCreate(BaseModel):
    service_name: str
    level: Literal["debug", "info", "warning", "error", "critical"] = "info"
    message: str
    metadata: Optional[dict] = None


class SystemLog(SystemLogCreate):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Analytics / Stats ─────────────────────────────────────────

class DetectionStats(BaseModel):
    total_today: int = 0
    total_week: int = 0
    total_month: int = 0
    critical_count: int = 0
    by_object_type: dict = {}
    by_camera: dict = {}
    by_severity: dict = {}


class DashboardSummary(BaseModel):
    detections_today: int = 0
    critical_alerts: int = 0
    active_cameras: int = 0
    online_cameras: int = 0
    avg_confidence: float = 0.0
    open_incidents: int = 0
    recent_detections: list[Detection] = []
