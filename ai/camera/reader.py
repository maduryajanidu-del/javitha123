"""
Camera stream reader — connects to ESP32-CAM or falls back to webcam.
Handles automatic reconnection on stream failure.
"""

import cv2
import time
import logging
from typing import Generator, Optional

from ai.config import config

logger = logging.getLogger("railway.camera_reader")


class CameraReader:
    """Reads frames from an ESP32-CAM stream or local webcam."""

    def __init__(self):
        self.stream_url = config.CAMERA_STREAM_URL
        self.use_webcam = config.USE_WEBCAM_FALLBACK
        self.webcam_index = config.WEBCAM_INDEX
        self.cap: Optional[cv2.VideoCapture] = None
        self.is_connected = False
        self.reconnect_attempts = 0
        self.source_name = "unknown"

    def connect(self) -> bool:
        """Attempt to connect to the camera source."""
        # Try ESP32-CAM first
        if self.stream_url and not self.use_webcam:
            logger.info(f"Connecting to ESP32-CAM: {self.stream_url}")
            self.cap = cv2.VideoCapture(self.stream_url)
            if self.cap.isOpened():
                self.is_connected = True
                self.source_name = f"ESP32-CAM ({self.stream_url})"
                self.reconnect_attempts = 0
                logger.info(f"✅ Connected to {self.source_name}")
                return True
            else:
                logger.warning("ESP32-CAM connection failed")

        # Fallback to webcam
        if self.use_webcam or not self.is_connected:
            logger.info(f"Using webcam (index {self.webcam_index}) as fallback")
            self.cap = cv2.VideoCapture(self.webcam_index)
            if self.cap.isOpened():
                self.is_connected = True
                self.source_name = f"Webcam (index {self.webcam_index})"
                self.reconnect_attempts = 0
                logger.info(f"✅ Connected to {self.source_name}")
                return True

        self.is_connected = False
        logger.error("❌ Failed to connect to any camera source")
        return False

    def reconnect(self) -> bool:
        """Attempt to reconnect after a stream failure."""
        self.reconnect_attempts += 1
        if self.reconnect_attempts > config.MAX_RECONNECT_ATTEMPTS:
            logger.error("Max reconnection attempts reached")
            return False

        logger.info(
            f"Reconnecting (attempt {self.reconnect_attempts}/{config.MAX_RECONNECT_ATTEMPTS})..."
        )
        self.release()
        time.sleep(config.RECONNECT_DELAY)
        return self.connect()

    def read_frame(self) -> Optional["cv2.typing.MatLike"]:
        """Read a single frame from the camera."""
        if not self.is_connected or self.cap is None:
            return None

        ret, frame = self.cap.read()
        if not ret or frame is None:
            logger.warning("Failed to read frame — stream may be broken")
            self.is_connected = False
            return None

        # Resize if needed
        h, w = frame.shape[:2]
        target_w, target_h = config.INPUT_RESOLUTION
        if w != target_w or h != target_h:
            frame = cv2.resize(frame, (target_w, target_h))

        return frame

    def frames(self) -> Generator:
        """Generator that yields frames continuously with reconnection."""
        if not self.is_connected:
            self.connect()

        frame_count = 0
        while True:
            frame = self.read_frame()

            if frame is None:
                if not self.reconnect():
                    logger.error("Cannot reconnect — stopping frame generator")
                    break
                continue

            frame_count += 1
            yield frame_count, frame

    def release(self):
        """Release the camera resource."""
        if self.cap is not None:
            self.cap.release()
            self.cap = None
        self.is_connected = False

    @property
    def status(self) -> str:
        return "online" if self.is_connected else "offline"
