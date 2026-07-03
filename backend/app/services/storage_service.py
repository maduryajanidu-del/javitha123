"""
Supabase Storage service for uploading detection snapshots.
"""

import io
from datetime import datetime, timezone
from uuid import uuid4

from app.db.supabase_client import get_supabase
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("storage_service")


class StorageService:
    """Handles image uploads to Supabase Storage."""

    def __init__(self):
        self.bucket = settings.supabase_storage_bucket

    def upload_detection_image(
        self,
        image_bytes: bytes,
        camera_id: str,
        event_id: str | None = None,
        content_type: str = "image/jpeg",
    ) -> str | None:
        """
        Upload a detection snapshot to Supabase Storage.
        Returns the public URL or None on failure.

        Path format: detections/{camera_id}/{YYYY}/{MM}/{DD}/{event_id}.jpg
        """
        try:
            sb = get_supabase()
            now = datetime.now(timezone.utc)
            eid = event_id or str(uuid4())

            path = (
                f"detections/{camera_id}/"
                f"{now.strftime('%Y')}/{now.strftime('%m')}/{now.strftime('%d')}/"
                f"{eid}.jpg"
            )

            # Upload to storage
            sb.storage.from_(self.bucket).upload(
                path=path,
                file=image_bytes,
                file_options={"content-type": content_type},
            )

            # Get public URL
            public_url = sb.storage.from_(self.bucket).get_public_url(path)
            logger.info(f"Uploaded image: {path}")
            return public_url

        except Exception as e:
            logger.error(f"Failed to upload image: {e}")
            return None

    def delete_detection_image(self, path: str) -> bool:
        """Delete an image from storage."""
        try:
            sb = get_supabase()
            sb.storage.from_(self.bucket).remove([path])
            logger.info(f"Deleted image: {path}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete image: {e}")
            return False
