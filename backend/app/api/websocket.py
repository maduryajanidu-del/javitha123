"""
WebSocket endpoint for realtime dashboard updates.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set
import json
import asyncio

router = APIRouter(tags=["websocket"])


class ConnectionManager:
    """Manages WebSocket connections for the dashboard."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        """Send a message to all connected clients."""
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for conn in dead:
            self.disconnect(conn)

    async def send_personal(self, websocket: WebSocket, message: dict):
        """Send a message to a specific client."""
        try:
            await websocket.send_json(message)
        except Exception:
            self.disconnect(websocket)

    @property
    def connection_count(self) -> int:
        return len(self.active_connections)


# Singleton manager
manager = ConnectionManager()


@router.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    """WebSocket endpoint for realtime dashboard updates."""
    await manager.connect(websocket)
    try:
        # Send initial connection confirmation
        await manager.send_personal(websocket, {
            "type": "connection",
            "data": {
                "status": "connected",
                "message": "Connected to Smart Railway realtime feed",
                "active_connections": manager.connection_count,
            }
        })

        # Keep connection alive and listen for client messages
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                msg = json.loads(data)

                # Handle ping/pong for keepalive
                if msg.get("type") == "ping":
                    await manager.send_personal(websocket, {"type": "pong"})
                elif msg.get("type") == "subscribe":
                    await manager.send_personal(websocket, {
                        "type": "subscribed",
                        "data": {"channel": msg.get("channel", "all")}
                    })
            except asyncio.TimeoutError:
                # Send heartbeat
                try:
                    await websocket.send_json({"type": "heartbeat"})
                except Exception:
                    break
            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


async def broadcast_detection(detection_data: dict):
    """Broadcast a new detection to all dashboard clients."""
    await manager.broadcast({
        "type": "new_detection",
        "data": detection_data,
    })


async def broadcast_camera_status(camera_id: str, status: str):
    """Broadcast camera status change."""
    await manager.broadcast({
        "type": "camera_status",
        "data": {"camera_id": camera_id, "status": status},
    })


async def broadcast_alert_update(alert_data: dict):
    """Broadcast an alert update."""
    await manager.broadcast({
        "type": "alert_update",
        "data": alert_data,
    })


async def broadcast_stats_update(stats: dict):
    """Broadcast updated stats."""
    await manager.broadcast({
        "type": "stats_update",
        "data": stats,
    })
