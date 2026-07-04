'use client';

import { useState } from 'react';
import { Settings, Shield, Bell, Cpu, Wifi, Save } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    confidenceThreshold: '0.6',
    alertCooldown: '10',
    stableFrameCount: '3',
    processEveryN: '2',
    modelPath: 'yolo11n.pt',
    telegramEnabled: true,
    emailEnabled: false,
    autoReconnect: true,
    maxReconnectAttempts: '50',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">System Settings</h2>
          <p className="page-subtitle">Configure detection thresholds, alerts, and model parameters</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {saved && (
            <span style={{ fontSize: '13px', color: 'var(--severity-low)', fontWeight: 500 }}>
              ✓ Settings saved
            </span>
          )}
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Detection Settings */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <Shield size={16} /> Detection Settings
            </span>
          </div>
          <div className="panel-body">
            <div className="settings-row">
              <div>
                <div className="settings-label">Confidence Threshold</div>
                <div className="settings-desc">Minimum detection confidence to trigger events</div>
              </div>
              <input
                className="settings-input"
                type="number"
                step="0.05"
                min="0.1"
                max="1.0"
                value={settings.confidenceThreshold}
                onChange={(e) => setSettings({ ...settings, confidenceThreshold: e.target.value })}
              />
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-label">Stable Frame Count</div>
                <div className="settings-desc">Frames an object must persist before triggering</div>
              </div>
              <input
                className="settings-input"
                type="number"
                min="1"
                max="10"
                value={settings.stableFrameCount}
                onChange={(e) => setSettings({ ...settings, stableFrameCount: e.target.value })}
              />
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-label">Process Every N Frames</div>
                <div className="settings-desc">Run inference on every Nth frame for performance</div>
              </div>
              <input
                className="settings-input"
                type="number"
                min="1"
                max="10"
                value={settings.processEveryN}
                onChange={(e) => setSettings({ ...settings, processEveryN: e.target.value })}
              />
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-label">Alert Cooldown (seconds)</div>
                <div className="settings-desc">Wait time between alerts for same tracked object</div>
              </div>
              <input
                className="settings-input"
                type="number"
                min="1"
                max="120"
                value={settings.alertCooldown}
                onChange={(e) => setSettings({ ...settings, alertCooldown: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Model Settings */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <Cpu size={16} /> AI Model
            </span>
          </div>
          <div className="panel-body">
            <div className="settings-row">
              <div>
                <div className="settings-label">Model</div>
                <div className="settings-desc">YOLO model variant for inference</div>
              </div>
              <select
                className="filter-select"
                value={settings.modelPath}
                onChange={(e) => setSettings({ ...settings, modelPath: e.target.value })}
              >
                <option value="yolo11n.pt">YOLO11n (Fast)</option>
                <option value="yolo11s.pt">YOLO11s (Balanced)</option>
                <option value="yolo26n.pt">YOLO26n (Newer)</option>
                <option value="yolo26s.pt">YOLO26s (Accurate)</option>
              </select>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div className="settings-label" style={{ marginBottom: '12px' }}>Monitored Object Classes</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Person', 'Car', 'Truck', 'Bus', 'Bicycle', 'Motorcycle', 'Dog', 'Cat', 'Horse', 'Cow'].map((cls) => (
                  <span key={cls} style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                    background: 'var(--accent-blue-glow)', color: 'var(--accent-blue)',
                    border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer',
                  }}>
                    {cls}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <Bell size={16} /> Notification Channels
            </span>
          </div>
          <div className="panel-body">
            <div className="settings-row">
              <div>
                <div className="settings-label">Telegram Alerts</div>
                <div className="settings-desc">Send photo alerts via Telegram Bot</div>
              </div>
              <div
                onClick={() => setSettings({ ...settings, telegramEnabled: !settings.telegramEnabled })}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: settings.telegramEnabled ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                  border: `1px solid ${settings.telegramEnabled ? 'var(--accent-blue)' : 'var(--border-primary)'}`,
                  position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: 'white', position: 'absolute', top: '2px',
                  left: settings.telegramEnabled ? '22px' : '2px',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-label">Email Alerts</div>
                <div className="settings-desc">Send email notifications (coming soon)</div>
              </div>
              <div
                onClick={() => setSettings({ ...settings, emailEnabled: !settings.emailEnabled })}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: settings.emailEnabled ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                  border: `1px solid ${settings.emailEnabled ? 'var(--accent-blue)' : 'var(--border-primary)'}`,
                  position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: 'white', position: 'absolute', top: '2px',
                  left: settings.emailEnabled ? '22px' : '2px',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Connection Settings */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <Wifi size={16} /> Connection
            </span>
          </div>
          <div className="panel-body">
            <div className="settings-row">
              <div>
                <div className="settings-label">Auto Reconnect</div>
                <div className="settings-desc">Automatically reconnect to camera on failure</div>
              </div>
              <div
                onClick={() => setSettings({ ...settings, autoReconnect: !settings.autoReconnect })}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: settings.autoReconnect ? 'var(--accent-blue)' : 'var(--bg-secondary)',
                  border: `1px solid ${settings.autoReconnect ? 'var(--accent-blue)' : 'var(--border-primary)'}`,
                  position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: 'white', position: 'absolute', top: '2px',
                  left: settings.autoReconnect ? '22px' : '2px',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </div>
            </div>

            <div className="settings-row">
              <div>
                <div className="settings-label">Max Reconnect Attempts</div>
                <div className="settings-desc">Stop trying after this many failures</div>
              </div>
              <input
                className="settings-input"
                type="number"
                min="1"
                max="100"
                value={settings.maxReconnectAttempts}
                onChange={(e) => setSettings({ ...settings, maxReconnectAttempts: e.target.value })}
              />
            </div>

            {/* Environment Status */}
            <div style={{ marginTop: '20px' }}>
              <div className="settings-label" style={{ marginBottom: '12px' }}>Environment Status</div>
              {[
                { name: 'Supabase', status: 'connected', color: 'var(--severity-low)' },
                { name: 'Redis', status: 'connected', color: 'var(--severity-low)' },
                { name: 'Telegram Bot', status: 'configured', color: 'var(--severity-low)' },
                { name: 'YOLO Model', status: 'loaded', color: 'var(--severity-low)' },
                { name: 'Laptop Webcam', status: 'active', color: 'var(--severity-low)' },
              ].map((env) => (
                <div key={env.name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 0', fontSize: '13px',
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{env.name}</span>
                  <span style={{
                    color: env.color, fontSize: '12px', fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <span className={`status-dot ${env.status === 'waiting' ? 'offline' : 'online'}`} style={{ width: '6px', height: '6px' }} />
                    {env.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
