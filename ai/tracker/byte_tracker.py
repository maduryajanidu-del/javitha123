"""
ByteTrack-based object tracker using the supervision library.
Provides stable object IDs across frames for deduplication.
"""

import logging
import numpy as np
from typing import Optional

import supervision as sv

from ai.detector.yolo_detector import DetectionResult

logger = logging.getLogger("railway.tracker")


class TrackedObject:
    """A detection with a stable tracker-assigned ID."""

    def __init__(
        self,
        tracker_id: int,
        class_name: str,
        confidence: float,
        bbox: tuple[int, int, int, int],
    ):
        self.tracker_id = tracker_id
        self.class_name = class_name
        self.confidence = confidence
        self.bbox = bbox

    @property
    def track_key(self) -> str:
        """Unique key for this tracked object."""
        return f"{self.class_name}_{self.tracker_id}"

    def __repr__(self):
        return f"Tracked(id={self.tracker_id}, {self.class_name}, conf={self.confidence:.2f})"


class ObjectTracker:
    """Wraps supervision's ByteTrack for stable object tracking."""

    def __init__(self):
        self.tracker = sv.ByteTrack(
            track_activation_threshold=0.25,
            lost_track_buffer=30,
            minimum_matching_threshold=0.8,
            frame_rate=15,
        )

    def update(self, detections: list[DetectionResult]) -> list[TrackedObject]:
        """
        Update the tracker with new detections and return tracked objects.
        """
        if not detections:
            # Still update tracker with empty detections to age out lost tracks
            empty = sv.Detections.empty()
            self.tracker.update_with_detections(empty)
            return []

        # Convert to supervision Detections
        bboxes = np.array([d.bbox for d in detections], dtype=np.float32)
        confidences = np.array([d.confidence for d in detections], dtype=np.float32)
        class_ids = np.array([d.class_id for d in detections], dtype=int)

        sv_detections = sv.Detections(
            xyxy=bboxes,
            confidence=confidences,
            class_id=class_ids,
        )

        # Run tracker
        tracked = self.tracker.update_with_detections(sv_detections)

        # Build class mapping from current detections
        class_map = {d.class_id: d.class_name for d in detections}

        # Build tracked objects
        results: list[TrackedObject] = []
        if tracked.tracker_id is not None:
            for i in range(len(tracked)):
                class_id = int(tracked.class_id[i]) if tracked.class_id is not None else -1
                class_name = class_map.get(class_id, "unknown")

                results.append(TrackedObject(
                    tracker_id=int(tracked.tracker_id[i]),
                    class_name=class_name,
                    confidence=float(tracked.confidence[i]) if tracked.confidence is not None else 0.0,
                    bbox=tuple(tracked.xyxy[i].astype(int)),
                ))

        return results

    def reset(self):
        """Reset the tracker state."""
        self.tracker = sv.ByteTrack(
            track_activation_threshold=0.25,
            lost_track_buffer=30,
            minimum_matching_threshold=0.8,
            frame_rate=15,
        )
