"""
Shared constants for the Smart Railway Detection System.
"""

# ── Severity Levels ───────────────────────────────────────────
SEVERITY_LOW = "low"
SEVERITY_NORMAL = "normal"
SEVERITY_HIGH = "high"
SEVERITY_CRITICAL = "critical"

SEVERITY_LEVELS = [SEVERITY_LOW, SEVERITY_NORMAL, SEVERITY_HIGH, SEVERITY_CRITICAL]

SEVERITY_COLORS = {
    SEVERITY_LOW: "#22c55e",       # green
    SEVERITY_NORMAL: "#eab308",    # yellow
    SEVERITY_HIGH: "#f97316",      # orange
    SEVERITY_CRITICAL: "#ef4444",  # red
}

# ── Camera Status ─────────────────────────────────────────────
STATUS_ONLINE = "online"
STATUS_OFFLINE = "offline"
STATUS_ERROR = "error"

CAMERA_STATUSES = [STATUS_ONLINE, STATUS_OFFLINE, STATUS_ERROR]

# ── Alert Channels ────────────────────────────────────────────
CHANNEL_TELEGRAM = "telegram"
CHANNEL_EMAIL = "email"
CHANNEL_WEBHOOK = "webhook"
CHANNEL_SMS = "sms"

ALERT_CHANNELS = [CHANNEL_TELEGRAM, CHANNEL_EMAIL, CHANNEL_WEBHOOK, CHANNEL_SMS]

# ── Alert Statuses ────────────────────────────────────────────
ALERT_PENDING = "pending"
ALERT_SENT = "sent"
ALERT_FAILED = "failed"
ALERT_ACKNOWLEDGED = "acknowledged"
ALERT_RESOLVED = "resolved"

ALERT_STATUSES = [ALERT_PENDING, ALERT_SENT, ALERT_FAILED, ALERT_ACKNOWLEDGED, ALERT_RESOLVED]

# ── Relevant Object Types ────────────────────────────────────
RAILWAY_OBJECTS = [
    "person", "bicycle", "car", "motorcycle", "bus", "truck",
    "cat", "dog", "horse", "cow", "sheep",
]

CRITICAL_OBJECTS = ["person", "car", "truck", "bus"]
HIGH_SEVERITY_OBJECTS = ["motorcycle", "bicycle", "dog"]

# ── Log Levels ────────────────────────────────────────────────
LOG_DEBUG = "debug"
LOG_INFO = "info"
LOG_WARNING = "warning"
LOG_ERROR = "error"
LOG_CRITICAL = "critical"
