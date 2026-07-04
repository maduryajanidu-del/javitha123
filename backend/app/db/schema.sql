-- ============================================================
-- Smart Railway Detection System — Database Schema
-- Run this in Supabase SQL Editor to create all tables.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Cameras ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cameras (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    location    TEXT,
    stream_url  TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'offline'
                    CHECK (status IN ('online', 'offline', 'error')),
    last_seen_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Detections ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS detections (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camera_id       UUID REFERENCES cameras(id) ON DELETE SET NULL,
    track_id        TEXT,
    object_type     TEXT NOT NULL,
    confidence      REAL NOT NULL,
    image_url       TEXT,
    frame_timestamp TIMESTAMPTZ,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    zone_name       TEXT,
    severity        TEXT NOT NULL DEFAULT 'normal'
                        CHECK (severity IN ('low', 'normal', 'high', 'critical')),
    alert_sent      BOOLEAN NOT NULL DEFAULT FALSE,
    alert_count     INTEGER NOT NULL DEFAULT 0,
    notes           TEXT
);

-- ── Alerts ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    detection_id     UUID REFERENCES detections(id) ON DELETE CASCADE,
    channel          TEXT NOT NULL DEFAULT 'telegram'
                        CHECK (channel IN ('telegram', 'email', 'webhook', 'sms')),
    status           TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'sent', 'failed', 'acknowledged', 'resolved')),
    sent_at          TIMESTAMPTZ,
    retry_count      INTEGER NOT NULL DEFAULT 0,
    response_payload JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── System Logs ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_logs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT NOT NULL,
    level        TEXT NOT NULL DEFAULT 'info'
                    CHECK (level IN ('debug', 'info', 'warning', 'error', 'critical')),
    message      TEXT NOT NULL,
    metadata     JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_detections_camera_id       ON detections(camera_id);
CREATE INDEX IF NOT EXISTS idx_detections_event_timestamp ON detections(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_detections_object_type     ON detections(object_type);
CREATE INDEX IF NOT EXISTS idx_detections_severity        ON detections(severity);
CREATE INDEX IF NOT EXISTS idx_detections_track_id        ON detections(track_id);
CREATE INDEX IF NOT EXISTS idx_alerts_detection_id        ON alerts(detection_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status              ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_logs_service        ON system_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_system_logs_level          ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created        ON system_logs(created_at DESC);

-- ── Row Level Security (optional, enable when Auth is set up) ──
-- ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE detections ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- ── Auto-update updated_at trigger ──
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cameras_updated_at
    BEFORE UPDATE ON cameras
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ── Initial Data ─────────────────────────────────────────────
-- Insert default camera used by local AI inference service
INSERT INTO cameras (id, name, location, stream_url, status)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'Local Webcam', 
    'Control Room', 
    'http://localhost', 
    'online'
) ON CONFLICT (id) DO NOTHING;

