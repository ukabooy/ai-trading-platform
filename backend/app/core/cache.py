# Simple in-memory cache (no Redis needed for free tier)
import asyncio
from typing import Any, Optional
from datetime import datetime, timedelta

_cache = {}


async def cache_set(key: str, value: Any, expire: int = 300) -> bool:
    _cache[key] = {
        "value": value,
        "expires": datetime.utcnow() + timedelta(seconds=expire)
    }
    return True


async def cache_get(key: str) -> Optional[Any]:
    item = _cache.get(key)
    if not item:
        return None
    if datetime.utcnow() > item["expires"]:
        del _cache[key]
        return None
    return item["value"]


async def cache_delete(key: str) -> bool:
    if key in _cache:
        del _cache[key]
    return True
