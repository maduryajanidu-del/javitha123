'use client';

import { useState } from 'react';
import {
  Camera, MapPin, Wifi, WifiOff, Clock, RefreshCw,
  Settings, Activity, Monitor
} from 'lucide-react';

export default function CamerasPage() {
  const [cameraStatus, setCameraStatus] = useState<'online' | 'offline'>('online');

  const camera = {
    id: '1',
    name: 'Laptop Webcam',
    location: 'Local Machine — Built-in Camera',
    device: 'Webcam Index 0',
    status: cameraStatus,
    lastSeen: '2 seconds ago',
    resolution: '640×480',
    fps: 24,
    detections: 134,
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Camera Management</h2>
          <p className="page-subtitle">
            {camera.status === 'online' ? '1/1' : '0/1'} camera online
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setCameraStatus(prev => prev === 'online' ? 'offline' : 'online')}
        >
          <RefreshCw size={14} /> Reconnect
        </button>
      </div>

      {/* Status summary */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-card-label" style={{ marginBottom: '8px' }}>Status</div>
          <div className="kpi-card-value" style={{ color: camera.status === 'online' ? 'var(--severity-low)' : 'var(--status-offline)' }}>
            {camera.status === 'online' ? 'Online' : 'Offline'}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-label" style={{ marginBottom: '8px' }}>Resolution</div>
          <div className="kpi-card-value">{camera.resolution}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-label" style={{ marginBottom: '8px' }}>Total Detections</div>
          <div className="kpi-card-value">{camera.detections}</div>
        </div>
      </div>

      {/* Single Camera Card */}
      <div className="camera-grid">
        <div className="camera-card" style={{ gridColumn: 'span 2' }}>
          <div className="camera-card-header">
            <div className="camera-card-name">
              <span className={`status-dot ${camera.status}`} />
              {camera.name}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="header-icon-btn" title="Reconnect">
                <RefreshCw size={13} />
              </button>
              <button className="header-icon-btn" title="Settings">
                <Settings size={13} />
              </button>
            </div>
          </div>

          <div className="camera-card-detail">
            <Monitor size={13} /> {camera.location}
          </div>

          <div className="camera-card-detail" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
            {camera.status === 'online'
              ? <Wifi size={13} style={{ color: 'var(--severity-low)' }} />
              : <WifiOff size={13} style={{ color: 'var(--status-offline)' }} />
            }
            {camera.device} • {camera.resolution} • {camera.fps} FPS
          </div>

          <div className="camera-card-detail">
            <Clock size={13} /> Last seen: {camera.lastSeen}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-primary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <Activity size={13} style={{ color: 'var(--accent-blue)' }} />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{camera.detections}</span>
              <span style={{ color: 'var(--text-muted)' }}>detections</span>
            </div>
            <span className={`severity-badge ${camera.status === 'online' ? 'low' : 'normal'}`} style={{ fontSize: '10px' }}>
              {camera.status}
            </span>
          </div>
        </div>
      </div>

      {/* Info notice */}
      <div style={{
        marginTop: '20px', padding: '14px 18px',
        background: 'var(--accent-blue-glow)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: 'var(--radius-md)',
        fontSize: '13px', color: 'var(--text-secondary)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <Camera size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
        This system uses your laptop&apos;s built-in webcam for real-time object detection. The AI pipeline captures frames directly from the local camera.
      </div>
    </div>
  );
}
