'use client';

import { useState } from 'react';
import {
  Camera, MapPin, Wifi, WifiOff, Clock, RefreshCw,
  Plus, Settings, Trash2, Activity
} from 'lucide-react';

const demoCameras = [
  { id: '1', name: 'Track-01', location: 'Railway Track Section A', url: 'http://192.168.1.101:81/stream', status: 'online', lastSeen: '2 seconds ago', detections: 198 },
  { id: '2', name: 'Track-02', location: 'Railway Track Section B', url: 'http://192.168.1.102:81/stream', status: 'online', lastSeen: '5 seconds ago', detections: 156 },
  { id: '3', name: 'Crossing-01', location: 'Level Crossing Main', url: 'http://192.168.1.103:81/stream', status: 'online', lastSeen: '3 seconds ago', detections: 112 },
  { id: '4', name: 'Platform-A', location: 'Station Platform A', url: 'http://192.168.1.104:81/stream', status: 'online', lastSeen: '1 second ago', detections: 89 },
  { id: '5', name: 'Bridge-01', location: 'Railway Bridge Section', url: 'http://192.168.1.105:81/stream', status: 'online', lastSeen: '8 seconds ago', detections: 65 },
  { id: '6', name: 'Yard-01', location: 'Maintenance Yard', url: 'http://192.168.1.106:81/stream', status: 'offline', lastSeen: '2 hours ago', detections: 26 },
];

export default function CamerasPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  const onlineCount = demoCameras.filter(c => c.status === 'online').length;
  const totalCount = demoCameras.length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Camera Management</h2>
          <p className="page-subtitle">{onlineCount}/{totalCount} cameras online</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          <Plus size={14} /> Add Camera
        </button>
      </div>

      {/* Status summary */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-card-label" style={{ marginBottom: '8px' }}>Online</div>
          <div className="kpi-card-value" style={{ color: 'var(--severity-low)' }}>{onlineCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-label" style={{ marginBottom: '8px' }}>Offline</div>
          <div className="kpi-card-value" style={{ color: 'var(--status-offline)' }}>{totalCount - onlineCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-label" style={{ marginBottom: '8px' }}>Total Detections</div>
          <div className="kpi-card-value">{demoCameras.reduce((sum, c) => sum + c.detections, 0)}</div>
        </div>
      </div>

      {/* Camera Grid */}
      <div className="camera-grid">
        {demoCameras.map((cam) => (
          <div key={cam.id} className="camera-card">
            <div className="camera-card-header">
              <div className="camera-card-name">
                <span className={`status-dot ${cam.status}`} />
                {cam.name}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="header-icon-btn" title="Recheck stream">
                  <RefreshCw size={13} />
                </button>
                <button className="header-icon-btn" title="Settings">
                  <Settings size={13} />
                </button>
              </div>
            </div>

            <div className="camera-card-detail">
              <MapPin size={13} /> {cam.location}
            </div>

            <div className="camera-card-detail" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
              {cam.status === 'online' ? <Wifi size={13} style={{ color: 'var(--severity-low)' }} /> : <WifiOff size={13} style={{ color: 'var(--status-offline)' }} />}
              {cam.url}
            </div>

            <div className="camera-card-detail">
              <Clock size={13} /> Last seen: {cam.lastSeen}
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-primary)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <Activity size={13} style={{ color: 'var(--accent-blue)' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cam.detections}</span>
                <span style={{ color: 'var(--text-muted)' }}>detections</span>
              </div>
              <span className={`severity-badge ${cam.status === 'online' ? 'low' : 'normal'}`} style={{ fontSize: '10px' }}>
                {cam.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
