"""
API request/response schemas — thin wrappers for API-specific shapes.
"""

from pydantic import BaseModel
from typing import Optional, Any, Literal
from datetime import datetime
from uuid import UUID


class PaginatedResponse(BaseModel):
    data: list[Any]
    total: int
    page: int
    page_size: int
    has_more: bool


class DetectionFilter(BaseModel):
    camera_id: Optional[UUID] = None
    object_type: Optional[str] = None
    severity: Optional[Literal["low", "normal", "high", "critical"]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    alert_sent: Optional[bool] = None
    search: Optional[str] = None
    page: int = 1
    page_size: int = 20


class TimelinePoint(BaseModel):
    timestamp: str
    count: int


class ObjectTypeCount(BaseModel):
    object_type: str
    count: int


class CameraActivityCount(BaseModel):
    camera_id: str
    camera_name: str
    count: int


class AnalyticsSummary(BaseModel):
    total_today: int = 0
    total_week: int = 0
    total_month: int = 0
    critical_count: int = 0
    avg_confidence: float = 0.0
    top_camera: Optional[str] = None
    by_object: list[ObjectTypeCount] = []
    by_camera: list[CameraActivityCount] = []
    hourly_trend: list[TimelinePoint] = []


class WebSocketMessage(BaseModel):
    type: Literal["new_detection", "camera_status", "alert_update", "stats_update", "connection", "pong", "subscribed", "heartbeat"]
    data: dict


class TestAlertRequest(BaseModel):
    channel: str = "telegram"
    message: str = "Test alert from Smart Railway System"


class TestAlertResponse(BaseModel):
    success: bool
    message: str
    details: Optional[dict] = None
