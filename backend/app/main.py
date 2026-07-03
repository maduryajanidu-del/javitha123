"""
Smart Railway Detection System — FastAPI Backend
Main application entry point.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.redis_client import close_redis
from app.api import detections, cameras, alerts, analytics, websocket
from app.utils.logger import get_logger

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown hooks."""
    logger.info("🚀 Smart Railway Detection System starting...")
    logger.info("📡 API server ready")
    yield
    logger.info("🛑 Shutting down...")
    await close_redis()
    logger.info("✅ Shutdown complete")


app = FastAPI(
    title="Smart Railway Detection System",
    description="Real-time AI-powered railway safety monitoring platform",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(detections.router)
app.include_router(cameras.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(websocket.router)


# ── Root ──────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "name": "Smart Railway Detection System",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
