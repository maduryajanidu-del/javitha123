"""
Smart Railway AI Inference Service — Main Entry Point
Runs the complete detection pipeline: Camera → YOLO → Track → Dedup → Upload → Alert
"""

import asyncio
import logging
import sys
import time
import threading
from datetime import datetime, timezone
import cv2
from flask import Flask, Response
from flask_cors import CORS

from ai.config import config
from ai.camera.reader import CameraReader
from ai.detector.yolo_detector import YOLODetector
from ai.tracker.byte_tracker import ObjectTracker
from ai.event_filter.dedup import DeduplicationFilter
from ai.event_filter.event_builder import EventBuilder
from ai.uploader.storage_uploader import StorageUploader
from ai.notifier.telegram_notifier import TelegramNotifier

# ── Logging setup (UTF-8 safe for Windows) ────────────────────
import io
_utf8_stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace", line_buffering=True)
_handler = logging.StreamHandler(_utf8_stdout)
_handler.setFormatter(logging.Formatter(
    "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
))
logging.root.addHandler(_handler)
logging.root.setLevel(logging.INFO)
logger = logging.getLogger("railway.main")

# ── Flask Server for Live Video Stream ────────────────────────
global_frame = None
global_frame_lock = threading.Lock()

app = Flask(__name__)
CORS(app)

def generate_frames():
    global global_frame, global_frame_lock
    while True:
        with global_frame_lock:
            if global_frame is None:
                frame_to_yield = None
            else:
                frame_to_yield = global_frame.copy()
        
        if frame_to_yield is None:
            time.sleep(0.1)
            continue
            
        ret, buffer = cv2.imencode('.jpg', frame_to_yield)
        if not ret:
            time.sleep(0.1)
            continue
            
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.03)

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

def run_flask():
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)



async def process_event(
    event,
    frame,
    uploader: StorageUploader,
    notifier: TelegramNotifier,
):
    """Process a confirmed detection event asynchronously."""
    annotated = uploader.annotate(frame, event)
    # 1. Upload snapshot
    image_url = uploader.upload_snapshot(annotated, event)
    if image_url:
        event.image_url = image_url

    # 2. Encode frame for Telegram
    image_bytes = uploader.encode_frame(annotated)

    # 3. Save metadata to backend
    await uploader.save_metadata(event)

    # 4. Send Telegram alert
    if image_bytes:
        success = await notifier.send_alert(event, image_bytes)
        event.alert_sent = success

    logger.info(f"✅ Event processed: {event}")


def run_pipeline():
    """Main detection pipeline loop."""
    logger.info("=" * 60)
    logger.info("🚂 Smart Railway AI Detection Service")
    logger.info("=" * 60)

    # ── Initialize components ─────────────────────────────────
    camera = CameraReader()
    detector = YOLODetector()
    tracker = ObjectTracker()
    dedup = DeduplicationFilter()
    event_builder = EventBuilder(camera_id="00000000-0000-0000-0000-000000000001", zone_name="Railway Track Zone A")
    uploader = StorageUploader()
    notifier = TelegramNotifier()

    # ── Load model ────────────────────────────────────────────
    if not detector.load_model():
        logger.error("Failed to load YOLO model — exiting")
        sys.exit(1)

    # ── Connect camera ────────────────────────────────────────
    if not camera.connect():
        logger.error("Failed to connect to camera — exiting")
        sys.exit(1)

    logger.info(f"📹 Laptop Webcam: {camera.source_name}")
    logger.info(f"🤖 Model: {config.YOLO_MODEL_PATH}")
    logger.info(f"📊 Confidence threshold: {config.CONFIDENCE_THRESHOLD}")
    logger.info(f"⏱️  Processing every {config.PROCESS_EVERY_N_FRAMES} frames")
    logger.info(f"🔄 Stable frame count: {config.STABLE_FRAME_COUNT}")
    logger.info(f"⏳ Alert cooldown: {config.ALERT_COOLDOWN_SECONDS}s")
    logger.info("-" * 60)

    event_loop = asyncio.new_event_loop()
    def start_background_loop(loop: asyncio.AbstractEventLoop) -> None:
        asyncio.set_event_loop(loop)
        loop.run_forever()

    t = threading.Thread(target=start_background_loop, args=(event_loop,), daemon=True)
    t.start()
    
    # Start Flask Server Thread
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    logger.info("🎥 Live Video Stream started on http://localhost:5000/video_feed")
    total_events = 0
    fps_counter = 0
    fps_timer = time.time()

    try:
        for frame_num, frame in camera.frames():
            fps_counter += 1

            # Print FPS every 5 seconds
            if time.time() - fps_timer >= 5.0:
                fps = fps_counter / (time.time() - fps_timer)
                logger.info(f"📈 FPS: {fps:.1f} | Total events: {total_events}")
                fps_counter = 0
                fps_timer = time.time()

                # Clean stale dedup entries
                dedup.clear_stale()

            # Skip frames based on N
            if frame_num % config.PROCESS_EVERY_N_FRAMES != 0:
                continue

            # ── Detection ─────────────────────────────────────
            detections = detector.detect(frame)
            annotated_frame = frame.copy()
            tracked_objects = []

            if detections:
                # ── Tracking ──────────────────────────────────────
                tracked_objects = tracker.update(detections)
                
                # Annotate frame for live stream
                for tracked in tracked_objects:
                    x1, y1, x2, y2 = tracked.bbox
                    # Get severity for color
                    severity = detector.get_severity(tracked.class_name, tracked.confidence)
                    color = (0, 0, 255) if severity in ("critical", "high") else (0, 255, 0)
                    cv2.rectangle(annotated_frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                    label = f"{tracked.class_name} {tracked.confidence:.0%}"
                    cv2.putText(annotated_frame, label, (int(x1), int(y1) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            # Update global frame for stream
            global global_frame, global_frame_lock
            with global_frame_lock:
                global_frame = annotated_frame
                
            if not detections:
                continue

            # ── Event validation and dispatch ─────────────────
            for tracked in tracked_objects:
                severity = detector.get_severity(tracked.class_name, tracked.confidence)

                if not dedup.check(tracked, severity):
                    continue

                # Build event
                event = event_builder.build(
                    tracked=tracked,
                    severity=severity,
                    frame_timestamp=datetime.now(timezone.utc),
                )

                logger.info(
                    f"🎯 DETECTION: {event.object_type} | "
                    f"Confidence: {event.confidence:.0%} | "
                    f"Severity: {event.severity} | "
                    f"Track: {event.track_id}"
                )

                # Mark as alerted
                dedup.mark_alerted(tracked, severity)
                total_events += 1

                # Process event asynchronously in background thread
                asyncio.run_coroutine_threadsafe(
                    process_event(event, frame, uploader, notifier), event_loop
                )

    except KeyboardInterrupt:
        logger.info("\n🛑 Detection pipeline stopped by user")
    finally:
        camera.release()
        event_loop.close()
        logger.info(f"📊 Total events processed: {total_events}")
        logger.info("👋 Goodbye!")


if __name__ == "__main__":
    run_pipeline()
