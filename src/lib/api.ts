/**
 * API client for communicating with the FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

// ── Detections ─────────────────────────────────────────────────

export interface Detection {
  id: string;
  camera_id: string | null;
  track_id: string | null;
  object_type: string;
  confidence: number;
  image_url: string | null;
  frame_timestamp: string | null;
  event_timestamp: string;
  zone_name: string | null;
  severity: string;
  alert_sent: boolean;
  alert_count: number;
  notes: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface DetectionFilters {
  camera_id?: string;
  object_type?: string;
  severity?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export async function getDetections(filters: DetectionFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return fetchApi<PaginatedResponse<Detection>>(`/api/detections?${params}`);
}

export async function getRecentDetections(limit = 10) {
  return fetchApi<{ data: Detection[]; source: string }>(`/api/detections/recent?limit=${limit}`);
}

export async function getDetectionStats() {
  return fetchApi<{
    total_today: number;
    total_week: number;
    total_month: number;
    critical_today: number;
  }>('/api/detections/stats');
}

export async function getDetection(id: string) {
  return fetchApi<{ data: Detection }>(`/api/detections/${id}`);
}

// ── Cameras ────────────────────────────────────────────────────

export interface Camera {
  id: string;
  name: string;
  location: string | null;
  stream_url: string;
  status: string;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getCameras() {
  return fetchApi<{ data: Camera[] }>('/api/cameras');
}

export async function createCamera(data: { name: string; stream_url: string; location?: string }) {
  return fetchApi<{ data: Camera; success: boolean }>('/api/cameras', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCameraHealth(id: string) {
  return fetchApi<{
    camera_id: string;
    name: string;
    status: string;
    last_seen_at: string | null;
    is_healthy: boolean;
  }>(`/api/cameras/${id}/health`);
}

// ── Alerts ─────────────────────────────────────────────────────

export interface Alert {
  id: string;
  detection_id: string;
  channel: string;
  status: string;
  sent_at: string | null;
  retry_count: number;
  response_payload: Record<string, unknown> | null;
  created_at: string;
}

export async function getAlerts(status?: string) {
  const params = status ? `?status=${status}` : '';
  return fetchApi<{ data: Alert[] }>(`/api/alerts${params}`);
}

export async function testAlert() {
  return fetchApi<{ success: boolean; message: string }>('/api/alerts/test', {
    method: 'POST',
    body: JSON.stringify({ channel: 'telegram', message: 'Test alert from dashboard' }),
  });
}

export async function acknowledgeAlert(id: string) {
  return fetchApi<{ data: Alert; success: boolean }>(`/api/alerts/${id}/acknowledge`, {
    method: 'PATCH',
  });
}

export async function resolveAlert(id: string) {
  return fetchApi<{ data: Alert; success: boolean }>(`/api/alerts/${id}/resolve`, {
    method: 'PATCH',
  });
}

// ── Analytics ──────────────────────────────────────────────────

export interface AnalyticsSummary {
  total_today: number;
  total_week: number;
  total_month: number;
  critical_today: number;
  total_cameras: number;
  online_cameras: number;
  avg_confidence: number;
}

export interface TimelinePoint {
  timestamp: string;
  count: number;
}

export interface ObjectTypeCount {
  object_type: string;
  count: number;
}

export interface CameraActivityCount {
  camera_id: string;
  camera_name: string;
  count: number;
}

export async function getAnalyticsSummary() {
  return fetchApi<AnalyticsSummary>('/api/analytics/summary');
}

export async function getAnalyticsTimeline(hours = 24) {
  return fetchApi<{ data: TimelinePoint[]; interval: string }>(`/api/analytics/timeline?hours=${hours}`);
}

export async function getAnalyticsByObject(days = 7) {
  return fetchApi<{ data: ObjectTypeCount[] }>(`/api/analytics/by-object?days=${days}`);
}

export async function getAnalyticsByCamera(days = 7) {
  return fetchApi<{ data: CameraActivityCount[] }>(`/api/analytics/by-camera?days=${days}`);
}
