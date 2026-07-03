"""
Redis async client for cache, cooldown keys, and dashboard counters.
Redis is used ONLY as a temporary cache — never as the source of truth.
"""

import redis.asyncio as aioredis
from app.config import settings

_pool: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    """Return a singleton async Redis connection."""
    global _pool
    if _pool is None:
        _pool = aioredis.from_url(
            settings.redis_url,
            decode_responses=True,
            max_connections=20,
        )
    return _pool


async def close_redis():
    """Close the Redis connection pool."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
