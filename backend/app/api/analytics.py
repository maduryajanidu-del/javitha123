"""
Analytics API endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta, timezone

from app.db.supabase_client import get_supabase

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary")
async def analytics_summary():
    """Get a high-level analytics summary."""
    try:
        sb = get_supabase()
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        week_start = (now - timedelta(days=7)).isoformat()
        month_start = (now - timedelta(days=30)).isoformat()

        # Total counts
        today = sb.table("detections").select("id", count="exact").gte("event_timestamp", today_start).execute()
        week = sb.table("detections").select("id", count="exact").gte("event_timestamp", week_start).execute()
        month = sb.table("detections").select("id", count="exact").gte("event_timestamp", month_start).execute()
        critical = sb.table("detections").select("id", count="exact").gte("event_timestamp", today_start).eq("severity", "critical").execute()

        # Camera counts
        cameras = sb.table("cameras").select("id", count="exact").execute()
        online_cameras = sb.table("cameras").select("id", count="exact").eq("status", "online").execute()

        # Average confidence today
        today_detections = sb.table("detections").select("confidence").gte("event_timestamp", today_start).execute()
        confidences = [d["confidence"] for d in (today_detections.data or []) if d.get("confidence")]
        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0

        return {
            "total_today": today.count or 0,
            "total_week": week.count or 0,
            "total_month": month.count or 0,
            "critical_today": critical.count or 0,
            "total_cameras": cameras.count or 0,
            "online_cameras": online_cameras.count or 0,
            "avg_confidence": round(avg_conf, 2),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/timeline")
async def analytics_timeline(
    hours: int = Query(24, ge=1, le=168),
    interval: str = Query("hour", pattern="^(hour|day)$"),
):
    """Get detection counts over time."""
    try:
        sb = get_supabase()
        now = datetime.now(timezone.utc)
        start = (now - timedelta(hours=hours)).isoformat()

        result = (
            sb.table("detections")
            .select("event_timestamp")
            .gte("event_timestamp", start)
            .order("event_timestamp")
            .execute()
        )

        # Bucket into intervals
        buckets: dict[str, int] = {}
        for det in result.data or []:
            ts = datetime.fromisoformat(det["event_timestamp"].replace("Z", "+00:00"))
            if interval == "hour":
                key = ts.strftime("%Y-%m-%d %H:00")
            else:
                key = ts.strftime("%Y-%m-%d")
            buckets[key] = buckets.get(key, 0) + 1

        timeline = [{"timestamp": k, "count": v} for k, v in sorted(buckets.items())]
        return {"data": timeline, "interval": interval}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-object")
async def analytics_by_object(days: int = Query(7, ge=1, le=90)):
    """Get detection counts grouped by object type."""
    try:
        sb = get_supabase()
        start = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

        result = (
            sb.table("detections")
            .select("object_type")
            .gte("event_timestamp", start)
            .execute()
        )

        counts: dict[str, int] = {}
        for det in result.data or []:
            obj = det.get("object_type", "unknown")
            counts[obj] = counts.get(obj, 0) + 1

        data = [{"object_type": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-camera")
async def analytics_by_camera(days: int = Query(7, ge=1, le=90)):
    """Get detection counts grouped by camera."""
    try:
        sb = get_supabase()
        start = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

        result = (
            sb.table("detections")
            .select("camera_id")
            .gte("event_timestamp", start)
            .execute()
        )

        counts: dict[str, int] = {}
        for det in result.data or []:
            cam = det.get("camera_id") or "unknown"
            counts[cam] = counts.get(cam, 0) + 1

        # Resolve camera names
        cameras_result = sb.table("cameras").select("id, name").execute()
        cam_names = {c["id"]: c["name"] for c in (cameras_result.data or [])}

        data = [
            {
                "camera_id": k,
                "camera_name": cam_names.get(k, f"Camera {k[:8]}"),
                "count": v,
            }
            for k, v in sorted(counts.items(), key=lambda x: -x[1])
        ]
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
