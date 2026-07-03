"""
Camera management API endpoints.
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone

from app.db.supabase_client import get_supabase
from app.models.detection import CameraCreate, CameraUpdate

router = APIRouter(prefix="/api/cameras", tags=["cameras"])


@router.get("")
async def list_cameras():
    """List all cameras."""
    try:
        sb = get_supabase()
        result = sb.table("cameras").select("*").order("created_at", desc=True).execute()
        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_camera(camera: CameraCreate):
    """Register a new camera."""
    try:
        sb = get_supabase()
        data = camera.model_dump(mode="json")
        result = sb.table("cameras").insert(data).execute()
        return {"data": result.data[0] if result.data else None, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{camera_id}")
async def update_camera(camera_id: str, camera: CameraUpdate):
    """Update camera configuration."""
    try:
        sb = get_supabase()
        data = camera.model_dump(mode="json", exclude_none=True)
        if not data:
            raise HTTPException(status_code=400, detail="No fields to update")
        result = sb.table("cameras").update(data).eq("id", camera_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Camera not found")
        return {"data": result.data[0], "success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{camera_id}")
async def get_camera(camera_id: str):
    """Get a single camera."""
    try:
        sb = get_supabase()
        result = sb.table("cameras").select("*").eq("id", camera_id).single().execute()
        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Camera not found")


@router.get("/{camera_id}/health")
async def camera_health(camera_id: str):
    """Get camera health status."""
    try:
        sb = get_supabase()
        result = sb.table("cameras").select("*").eq("id", camera_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Camera not found")

        camera = result.data
        now = datetime.now(timezone.utc)
        last_seen = camera.get("last_seen_at")

        is_healthy = False
        if last_seen:
            last_dt = datetime.fromisoformat(last_seen.replace("Z", "+00:00"))
            is_healthy = (now - last_dt).total_seconds() < 60

        return {
            "camera_id": camera_id,
            "name": camera.get("name"),
            "status": camera.get("status"),
            "last_seen_at": last_seen,
            "is_healthy": is_healthy,
            "uptime_check": "ok" if is_healthy else "stale",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{camera_id}")
async def delete_camera(camera_id: str):
    """Delete a camera."""
    try:
        sb = get_supabase()
        result = sb.table("cameras").delete().eq("id", camera_id).execute()
        return {"success": True, "message": "Camera deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
