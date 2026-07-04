"""
Detection API endpoints.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime, timedelta, timezone
from app.db.supabase_client import get_supabase
from app.models.detection import Detection, DetectionCreate
from app.services.cache_service import CacheService

router = APIRouter(prefix="/api/detections", tags=["detections"])


@router.get("")
async def list_detections(
    camera_id: Optional[str] = None,
    object_type: Optional[str] = None,
    severity: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List detections with filters and pagination."""
    try:
        sb = get_supabase()
        query = sb.table("detections").select("*", count="exact")

        if camera_id:
            query = query.eq("camera_id", camera_id)
        if object_type:
            query = query.eq("object_type", object_type)
        if severity:
            query = query.eq("severity", severity)
        if date_from:
            query = query.gte("event_timestamp", date_from)
        if date_to:
            query = query.lte("event_timestamp", date_to)
        if search:
            safe_search = search.replace(',', '').replace('"', '').replace('%', '')
            query = query.or_(
                f"object_type.ilike.%{safe_search}%,zone_name.ilike.%{safe_search}%,notes.ilike.%{safe_search}%"
            )

        offset = (page - 1) * page_size
        query = query.order("event_timestamp", desc=True).range(offset, offset + page_size - 1)

        result = query.execute()
        total = result.count or 0

        return {
            "data": result.data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": offset + page_size < total,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recent")
async def recent_detections(limit: int = Query(10, ge=1, le=50)):
    """Get the most recent detections (uses Redis cache if available)."""
    try:
        # Try cache first
        cache = CacheService()
        cached = await cache.get_recent_detections()
        if cached:
            return {"data": cached[:limit], "source": "cache"}

        # Fallback to Supabase
        sb = get_supabase()
        result = (
            sb.table("detections")
            .select("*")
            .order("event_timestamp", desc=True)
            .limit(limit)
            .execute()
        )
        return {"data": result.data, "source": "database"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def detection_stats():
    """Get detection statistics."""
    try:
        sb = get_supabase()
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        week_start = (now - timedelta(days=7)).isoformat()
        month_start = (now - timedelta(days=30)).isoformat()

        # Today count
        today_result = (
            sb.table("detections")
            .select("id", count="exact")
            .gte("event_timestamp", today_start)
            .execute()
        )

        # Week count
        week_result = (
            sb.table("detections")
            .select("id", count="exact")
            .gte("event_timestamp", week_start)
            .execute()
        )

        # Month count
        month_result = (
            sb.table("detections")
            .select("id", count="exact")
            .gte("event_timestamp", month_start)
            .execute()
        )

        # Critical count today
        critical_result = (
            sb.table("detections")
            .select("id", count="exact")
            .gte("event_timestamp", today_start)
            .eq("severity", "critical")
            .execute()
        )

        return {
            "total_today": today_result.count or 0,
            "total_week": week_result.count or 0,
            "total_month": month_result.count or 0,
            "critical_today": critical_result.count or 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{detection_id}")
async def get_detection(detection_id: str):
    """Get a single detection by ID."""
    try:
        sb = get_supabase()
        result = sb.table("detections").select("*").eq("id", detection_id).single().execute()
        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Detection not found")


@router.post("")
async def create_detection(detection: DetectionCreate):
    """Create a new detection (used internally by AI service)."""
    try:
        sb = get_supabase()
        data = detection.model_dump(mode="json")
        result = sb.table("detections").insert(data).execute()
        return {"data": result.data[0] if result.data else None, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
