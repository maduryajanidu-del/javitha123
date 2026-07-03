"""
Supabase client wrapper for Postgres queries and Storage.
"""

from supabase import create_client, Client
from app.config import settings

_client: Client | None = None


def get_supabase() -> Client:
    """Return singleton Supabase client with service-role credentials."""
    global _client
    if _client is None:
        url = settings.supabase_url
        key = settings.supabase_service_role_key or settings.supabase_anon_key
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set."
            )
        _client = create_client(url, key)
    return _client
