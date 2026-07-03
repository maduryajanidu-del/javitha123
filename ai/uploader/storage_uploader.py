"""
Storage uploader — uploads detection snapshots to Supabase Storage
and saves metadata to Postgres via the backend API.
"""

import cv2
import logging
import httpx
import numpy as np
from datetime import datetime, timezone
from typing import Optional

from supabase import create_client

from ai.config import config
from ai.event_filter.event_builder import DetectionEvent

logger = logging.getLogger("railway.uploader")


class StorageUploader:
    """Handles async image upload and metadata persistence."""

    def __init__(self):
        self.backend_url = config.BACKEND_URL
        self._sb = None

    def _get_supabase(self):
        if self._sb is None and config.SUPABASE_URL and config.SUPABASE_SERVICE_ROLE_KEY:
            self._sb = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
        return self._sb

    def annotate(self, frame: np.ndarray, event: DetectionEvent) -> np.ndarray:
        """Draw bounding box and label on frame."""
        annotated = frame.copy()
        x1, y1, x2, y2 = event.bbox
        color = (0, 0, 255) if event.severity in ("critical", "high") else (0, 255, 0)
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        label = f"{event.object_type} {event.confidence:.0%}"
        cv2.putText(annotated, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        return annotated

    def upload_snapshot(
        self,
        annotated: np.ndarray,
        event: DetectionEvent,
    ) -> Optional[str]:
        """
        Encode annotated frame as JPEG, upload to Supabase Storage.
        Returns the public URL or None on failure.
        """
        try:
            # Encode as JPEG
            _, buffer = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
            image_bytes = buffer.tobytes()

            sb = self._get_supabase()
            if sb is None:
                logger.warning("Supabase not configured — skipping upload")
                return None

            now = datetime.now(timezone.utc)
            path = (
                f"detections/{event.camera_id}/"
                f"{now.strftime('%Y')}/{now.strftime('%m')}/{now.strftime('%d')}/"
                f"{event.event_id}.jpg"
            )

            sb.storage.from_(config.SUPABASE_STORAGE_BUCKET).upload(
                path=path,
                file=image_bytes,
                file_options={"content-type": "image/jpeg"},
            )

            public_url = sb.storage.from_(config.SUPABASE_STORAGE_BUCKET).get_public_url(path)
            logger.info(f"📸 Uploaded snapshot: {path}")
            return public_url

        except Exception as e:
            logger.error(f"Failed to upload snapshot: {e}")
            return None

    def encode_frame(self, annotated: np.ndarray) -> Optional[bytes]:
        """Encode an annotated frame as JPEG bytes."""
        try:
            _, buffer = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
            return buffer.tobytes()
        except Exception as e:
            logger.error(f"Failed to encode frame: {e}")
            return None

    async def save_metadata(self, event: DetectionEvent) -> bool:
        """Save detection metadata to Postgres via the backend API."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.backend_url}/api/detections",
                    json=event.to_dict(),
                )
                if response.status_code == 200:
                    logger.info(f"💾 Saved detection metadata: {event.event_id}")
                    return True
                else:
                    logger.error(f"Backend error: {response.status_code} — {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Failed to save metadata: {e}")
            return False
