'use client';

import { useState } from 'react';
import {
  MonitorPlay, Radio, Shield, Zap, Clock,
  Maximize2, Volume2, RefreshCw
} from 'lucide-react';
import type { WSMessage } from '@/lib/websocket';

interface LiveMonitorPageProps {
  lastMessage: WSMessage | null;
}

const demoLiveEvents = [
  { id: 1, time: '18:32:14', type: 'Person', severity: 'critical', camera: 'Track-01', conf: 94 },
  { id: 2, time: '18:31:52', type: 'Car', severity: 'high', camera: 'Crossing-01', conf: 87 },
  { id: 3, time: '18:31:08', type: 'Person', severity: 'critical', camera: 'Track-02', conf: 91 },
  { id: 4, time: '18:30:44', type: 'Dog', severity: 'normal', camera: 'Platform-A', conf: 73 },
  { id: 5, time: '18:29:15', type: 'Bicycle', severity: 'normal', camera: 'Track-01', conf: 78 },
  { id: 6, time: '18:28:33', type: 'Truck', severity: 'high', camera: 'Bridge-01', conf: 82 },
  { id: 7, time: '18:27:01', type: 'Person', severity: 'critical', camera: 'Crossing-01', conf: 96 },
  { id: 8, time: '18:25:44', type: 'Car', severity: 'high', camera: 'Track-02', conf: 85 },
  { id: 9, time: '18:24:12', type: 'Motorcycle', severity: 'high', camera: 'Bridge-01', conf: 79 },
  { id: 10, time: '18:22:55', type: 'Person', severity: 'normal', camera: 'Platform-A', conf: 68 },
];

const severityColor = (s: string) => {
  const map: Record<string, string> = {
    critical: '#ef4444', high: '#f97316', normal: '#eab308', low: '#22c55e',
  };
  return map[s] || '#6b7280';
};

export default function LiveMonitorPage({ lastMessage }: LiveMonitorPageProps) {
  const [selectedCamera] = useState('Track-01');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Live Monitoring</h2>
          <p className="page-subtitle">Real-time camera feed and detection stream</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Recheck Stream
          </button>
        </div>
      </div>

      <div className="grid-2-1">
        {/* Main Camera Feed */}
        <div>
          <div className="panel" style={{ marginBottom: '16px' }}>
            <div className="live-feed" style={{ minHeight: '420px' }}>
              {/* Live badge */}
              <div className="live-badge">
                <span className="live-badge-dot" />
                LIVE
              </div>

              {/* Camera controls overlay */}
              <div style={{
                position: 'absolute', bottom: '12px', right: '12px',
                display: 'flex', gap: '6px',
              }}>
                <button className="header-icon-btn" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                  <Maximize2 size={14} />
                </button>
                <button className="header-icon-btn" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                  <Volume2 size={14} />
                </button>
              </div>

              {/* Camera info overlay */}
              <div style={{
                position: 'absolute', bottom: '12px', left: '12px',
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                borderRadius: 'var(--radius-sm)', padding: '6px 12px',
                fontSize: '12px', color: 'var(--text-primary)',
              }}>
                📹 {selectedCamera} • 640×480 • 24 FPS
              </div>

              <div className="live-feed-placeholder">
                <MonitorPlay size={64} style={{ marginBottom: '16px', opacity: 0.2 }} />
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                  Camera Feed: {selectedCamera}
                </div>
                <div style={{ fontSize: '13px' }}>
                  Connect ESP32-CAM to view live stream
                </div>
                <div style={{ fontSize: '12px', marginTop: '8px', color: 'var(--accent-blue)' }}>
                  Waiting for video signal...
                </div>
              </div>
            </div>
          </div>

          {/* Detection Snapshot Gallery */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">
                <Shield size={16} /> Recent Detection Snapshots
              </span>
            </div>
            <div className="panel-body" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{
                  minWidth: '140px', height: '100px',
                  background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Snapshot {i}
                  </div>
                  {i <= 2 && (
                    <div style={{
                      position: 'absolute', top: '4px', right: '4px',
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: i === 1 ? '#ef4444' : '#f97316',
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Event Feed */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <Radio size={16} style={{ color: 'var(--severity-critical)' }} /> Live Event Feed
            </span>
            <span style={{
              fontSize: '11px', padding: '2px 8px',
              background: 'var(--severity-critical-bg)',
              color: 'var(--severity-critical)',
              borderRadius: '10px', fontWeight: 600,
            }}>
              {demoLiveEvents.length} events
            </span>
          </div>
          <div style={{ maxHeight: '600px', overflow: 'auto' }}>
            <div className="event-timeline" style={{ padding: '4px 0' }}>
              {demoLiveEvents.map((event) => (
                <div key={event.id} className="event-item">
                  <div style={{
                    width: '4px', height: '36px', borderRadius: '2px',
                    background: severityColor(event.severity), flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {event.type}
                      </span>
                      <span className={`severity-badge ${event.severity}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                        {event.severity}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={10} /> {event.time}
                      </span>
                      <span>📹 {event.camera}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Zap size={10} /> {event.conf}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
