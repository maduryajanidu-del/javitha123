"""
Alert management API endpoints.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional

from app.db.supabase_client import get_supabase
from app.services.telegram_service import TelegramService
from app.schemas.detection import TestAlertRequest, TestAlertResponse

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
async def list_alerts(
    status: Optional[str] = None,
    channel: Optional[str] = None,
    limit: int = 50,
):
    """List alerts with optional filters."""
    try:
        sb = get_supabase()
        query = sb.table("alerts").select("*")

        if status:
            query = query.eq("status", status)
        if channel:
            query = query.eq("channel", channel)

        result = query.order("created_at", desc=True).limit(limit).execute()
        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{alert_id}")
async def get_alert(alert_id: str):
    """Get a single alert."""
    try:
        sb = get_supabase()
        result = sb.table("alerts").select("*").eq("id", alert_id).single().execute()
        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Alert not found")


@router.post("/test")
async def test_alert(req: TestAlertRequest):
    """Send a test alert to verify notification channel."""
    try:
        telegram = TelegramService()
        success = await telegram.send_text_alert(
            f"🧪 TEST ALERT\n\n{req.message}\n\nChannel: {req.channel}\nSystem: Smart Railway Detection"
        )
        return TestAlertResponse(
            success=success,
            message="Test alert sent successfully" if success else "Failed to send test alert",
        )
    except Exception as e:
        return TestAlertResponse(success=False, message=str(e))


@router.patch("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    """Acknowledge an alert."""
    try:
        sb = get_supabase()
        result = (
            sb.table("alerts")
            .update({"status": "acknowledged"})
            .eq("id", alert_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Alert not found")
        return {"data": result.data[0], "success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    """Mark an alert as resolved."""
    try:
        sb = get_supabase()
        result = (
            sb.table("alerts")
            .update({"status": "resolved"})
            .eq("id", alert_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Alert not found")
        return {"data": result.data[0], "success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
