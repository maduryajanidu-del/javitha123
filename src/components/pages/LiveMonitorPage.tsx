'use client';

import { useState, useEffect } from 'react';
import {
  MonitorPlay, Radio, Shield, Zap, Clock,
  Maximize2, Volume2, RefreshCw
} from 'lucide-react';
import type { WSMessage } from '@/lib/websocket';
import { getRecentDetections, Detection } from '@/lib/api';

interface LiveMonitorPageProps {
  lastMessage: WSMessage | null;
}

const severityColor = (s: string) => {
  const map: Record<string, string> = {
    critical: '#ef4444', high: '#f97316', normal: '#eab308', low: '#22c55e',
  };
  return map[s] || '#6b7280';
};

export default function LiveMonitorPage({ lastMessage }: LiveMonitorPageProps) {
  const [selectedCamera] = useState('Local Webcam');
  const [events, setEvents] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    getRecentDetections(20).then((res) => {
      setEvents(res.data);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch recent detections', err);
      setLoading(false);
    });
  }, []);

  // Listen to new websocket events
  useEffect(() => {
    if (lastMessage?.type === 'new_detection') {
      const newEvent = lastMessage.payload as Detection;
      setEvents(prev => [newEvent, ...prev].slice(0, 50));
    }
  }, [lastMessage]);

  const snapshots = events.filter(e => e.image_url).slice(0, 5);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Live Monitoring</h2>
          <p className="page-subtitle">Real-time camera feed and detection stream</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>
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

              <div style={{ width: '100%', height: '100%', minHeight: '420px', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
                <img 
                  src="http://localhost:5000/video_feed" 
                  alt="Live Camera Feed"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const placeholder = document.getElementById('feed-error-placeholder');
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                />
                <div id="feed-error-placeholder" className="live-feed-placeholder" style={{ display: 'none', height: '100%' }}>
                  <MonitorPlay size={64} style={{ marginBottom: '16px', opacity: 0.2 }} />
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                    Camera Feed: {selectedCamera}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--severity-critical)' }}>
                    Failed to connect to video stream. Is the AI service running?
                  </div>
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
            <div className="panel-body" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', minHeight: '130px' }}>
              {snapshots.map((event) => (
                <div key={event.id} style={{
                  minWidth: '140px', height: '100px',
                  background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                  backgroundImage: `url(${event.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}>
                  {event.severity === 'critical' && (
                    <div style={{
                      position: 'absolute', top: '4px', right: '4px',
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: '#ef4444',
                    }} />
                  )}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(0,0,0,0.6)', padding: '2px 4px',
                    fontSize: '9px', color: '#fff', textAlign: 'center'
                  }}>
                    {event.object_type} • {Math.round(event.confidence * 100)}%
                  </div>
                </div>
              ))}
              {snapshots.length === 0 && !loading && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '20px', width: '100%', textAlign: 'center' }}>
                  No snapshots yet. Waiting for AI detections...
                </div>
              )}
              {loading && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '20px', width: '100%', textAlign: 'center' }}>
                  Loading...
                </div>
              )}
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
              {events.length} events
            </span>
          </div>
          <div style={{ maxHeight: '600px', overflow: 'auto' }}>
            <div className="event-timeline" style={{ padding: '4px 0' }}>
              {events.map((event) => (
                <div key={event.id} className="event-item">
                  <div style={{
                    width: '4px', height: '36px', borderRadius: '2px',
                    background: severityColor(event.severity), flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {event.object_type.charAt(0).toUpperCase() + event.object_type.slice(1)}
                      </span>
                      <span className={`severity-badge ${event.severity}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                        {event.severity}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={10} /> {new Date(event.event_timestamp).toLocaleTimeString()}
                      </span>
                      <span>📹 {selectedCamera}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Zap size={10} /> {Math.round(event.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {events.length === 0 && !loading && (
                 <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
                  No detections recorded yet.
                </div>
              )}
              {loading && (
                 <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
                  Loading events...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
