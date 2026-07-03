"""
YOLO object detector using the Ultralytics library.
"""

import logging
import numpy as np
from typing import Optional
from ultralytics import YOLO

from ai.config import config

logger = logging.getLogger("railway.detector")


class DetectionResult:
    """A single detection result from YOLO."""

    def __init__(
        self,
        class_id: int,
        class_name: str,
        confidence: float,
        bbox: tuple[int, int, int, int],  # x1, y1, x2, y2
    ):
        self.class_id = class_id
        self.class_name = class_name
        self.confidence = confidence
        self.bbox = bbox

    def __repr__(self):
        return f"Detection({self.class_name}, conf={self.confidence:.2f}, bbox={self.bbox})"


class YOLODetector:
    """Loads and runs YOLO inference on video frames."""

    def __init__(self):
        self.model: Optional[YOLO] = None
        self.model_path = config.YOLO_MODEL_PATH
        self.confidence_threshold = config.CONFIDENCE_THRESHOLD
        self.relevant_classes = config.RELEVANT_CLASSES
        self._class_name_to_id: dict[str, int] = {}

    def load_model(self) -> bool:
        """Load the YOLO model. Downloads automatically if needed."""
        try:
            logger.info(f"Loading YOLO model: {self.model_path}")
            self.model = YOLO(self.model_path)

            # Build class name mapping
            if self.model.names:
                self._class_name_to_id = {v: k for k, v in self.model.names.items()}

            logger.info(f"✅ Model loaded: {self.model_path}")
            logger.info(f"   Classes: {len(self.model.names)} total, "
                        f"monitoring {len(self.relevant_classes)} relevant")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            return False

    def detect(self, frame: np.ndarray) -> list[DetectionResult]:
        """
        Run detection on a single frame.
        Returns only relevant detections above the confidence threshold.
        """
        if self.model is None:
            logger.error("Model not loaded — call load_model() first")
            return []

        try:
            results = self.model(frame, verbose=False, conf=self.confidence_threshold)

            detections: list[DetectionResult] = []
            for result in results:
                boxes = result.boxes
                if boxes is None:
                    continue

                for i in range(len(boxes)):
                    cls_id = int(boxes.cls[i].item())
                    cls_name = self.model.names.get(cls_id, "unknown")
                    conf = float(boxes.conf[i].item())

                    # Filter by relevant classes
                    if cls_name not in self.relevant_classes:
                        continue

                    # Get bounding box
                    x1, y1, x2, y2 = boxes.xyxy[i].cpu().numpy().astype(int)

                    detections.append(DetectionResult(
                        class_id=cls_id,
                        class_name=cls_name,
                        confidence=conf,
                        bbox=(int(x1), int(y1), int(x2), int(y2)),
                    ))

            return detections

        except Exception as e:
            logger.error(f"Detection failed: {e}")
            return []

    def get_severity(self, class_name: str, confidence: float) -> str:
        """Determine severity level based on object type and confidence."""
        if class_name in config.CRITICAL_OBJECTS and confidence > 0.8:
            return "critical"
        elif class_name in config.CRITICAL_OBJECTS:
            return "high"
        elif class_name in config.HIGH_SEVERITY_OBJECTS:
            return "high" if confidence > 0.8 else "normal"
        else:
            return "normal" if confidence > 0.7 else "low"
