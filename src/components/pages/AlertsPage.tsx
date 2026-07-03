'use client';

import { useState } from 'react';
import {
  Bell, CheckCircle, XCircle, Clock, AlertTriangle,
  Send, Filter, Eye, CheckCheck, type LucideIcon
} from 'lucide-react';

const demoAlerts = [
  { id: 'a1', type: 'Person detected', severity: 'critical', camera: 'Track-01', time: '18:32:14', status: 'sent', channel: 'telegram', confidence: 94 },
  { id: 'a2', type: 'Car on tracks', severity: 'high', camera: 'Crossing-01', time: '18:28:41', status: 'sent', channel: 'telegram', confidence: 87 },
  { id: 'a3', type: 'Person detected', severity: 'critical', camera: 'Track-02', time: '18:15:22', status: 'acknowledged', channel: 'telegram', confidence: 91 },
  { id: 'a4', type: 'Dog near tracks', severity: 'normal', camera: 'Platform-A', time: '17:52:08', status: 'resolved', channel: 'telegram', confidence: 73 },
  { id: 'a5', type: 'Truck approaching', severity: 'high', camera: 'Bridge-01', time: '17:41:33', status: 'sent', channel: 'telegram', confidence: 82 },
  { id: 'a6', type: 'Bicycle on tracks', severity: 'normal', camera: 'Track-01', time: '17:19:55', status: 'failed', channel: 'telegram', confidence: 78 },
  { id: 'a7', type: 'Person detected', severity: 'critical', camera: 'Crossing-01', time: '16:58:12', status: 'acknowledged', channel: 'telegram', confidence: 96 },
  { id: 'a8', type: 'Car near crossing', severity: 'high', camera: 'Track-02', time: '16:44:39', status: 'resolved', channel: 'telegram', confidence: 85 },
  { id: 'a9', type: 'Motorcycle detected', severity: 'high', camera: 'Bridge-01', time: '16:22:17', status: 'sent', channel: 'telegram', confidence: 79 },
  { id: 'a10', type: 'Person on platform', severity: 'normal', camera: 'Platform-A', time: '15:55:41', status: 'resolved', channel: 'telegram', confidence: 68 },
];

const statusConfig: Record<string, { color: string; bg: string; icon: LucideIcon }> = {
  sent: { color: 'var(--accent-blue)', bg: 'var(--accent-blue-glow)', icon: Send },
  acknowledged: { color: 'var(--severity-normal)', bg: 'var(--severity-normal-bg)', icon: Eye },
  resolved: { color: 'var(--severity-low)', bg: 'var(--severity-low-bg)', icon: CheckCircle },
  failed: { color: 'var(--severity-critical)', bg: 'var(--severity-critical-bg)', icon: XCircle },
  pending: { color: 'var(--text-muted)', bg: 'var(--bg-card-hover)', icon: Clock },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(demoAlerts);
  const [statusFilter, setStatusFilter] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  const filtered = statusFilter
    ? alerts.filter(a => a.status === statusFilter)
    : alerts;

  const handleTestAlert = () => {
    setTestResult('Sending test alert...');
    setTimeout(() => setTestResult('✅ Test alert sent successfully!'), 1500);
    setTimeout(() => setTestResult(null), 4000);
  };

  const counts = {
    total: alerts.length,
    sent: alerts.filter(a => a.status === 'sent').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    failed: alerts.filter(a => a.status === 'failed').length,
  };

  const updateAlertStatus = (id: string, newStatus: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Alert Management</h2>
          <p className="page-subtitle">{counts.total} alerts today • {counts.sent + counts.acknowledged} active</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {testResult && (
            <span style={{ fontSize: '12px', color: 'var(--severity-low)', animation: 'fadeIn 0.3s ease' }}>
              {testResult}
            </span>
          )}
          <button className="btn btn-primary btn-sm" onClick={handleTestAlert}>
            <Send size={14} /> Send Test Alert
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        {[
          { label: 'Sent', count: counts.sent, color: 'var(--accent-blue)' },
          { label: 'Acknowledged', count: counts.acknowledged, color: 'var(--severity-normal)' },
          { label: 'Resolved', count: counts.resolved, color: 'var(--severity-low)' },
          { label: 'Failed', count: counts.failed, color: 'var(--severity-critical)' },
        ].map((item) => (
          <div
            key={item.label}
            className="kpi-card"
            style={{ cursor: 'pointer', borderColor: statusFilter === item.label.toLowerCase() ? item.color : undefined }}
            onClick={() => setStatusFilter(statusFilter === item.label.toLowerCase() ? '' : item.label.toLowerCase())}
          >
            <div className="kpi-card-label" style={{ marginBottom: '8px' }}>{item.label}</div>
            <div className="kpi-card-value" style={{ color: item.color, fontSize: '28px' }}>{item.count}</div>
          </div>
        ))}
      </div>

      {/* Alerts Table */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">
            <Bell size={16} /> Alert History
          </span>
          {statusFilter && (
            <button className="btn btn-sm btn-secondary" onClick={() => setStatusFilter('')}>
              Clear Filter
            </button>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Alert Type</th>
                <th>Camera</th>
                <th>Confidence</th>
                <th>Severity</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((alert) => {
                const sc = statusConfig[alert.status] || statusConfig.pending;
                const StatusIcon = sc.icon;
                return (
                  <tr key={alert.id}>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{alert.time}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{alert.type}</td>
                    <td>{alert.camera}</td>
                    <td>{alert.confidence}%</td>
                    <td>
                      <span className={`severity-badge ${alert.severity}`}>{alert.severity}</span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{alert.channel}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 10px', borderRadius: '20px',
                        background: sc.bg, color: sc.color,
                        fontSize: '11px', fontWeight: 600, textTransform: 'capitalize',
                      }}>
                        <StatusIcon size={12} /> {alert.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {alert.status === 'sent' && (
                          <button className="btn btn-sm btn-secondary" style={{ padding: '3px 8px' }} title="Acknowledge" onClick={() => updateAlertStatus(alert.id, 'acknowledged')}>
                            <Eye size={12} />
                          </button>
                        )}
                        {(alert.status === 'sent' || alert.status === 'acknowledged') && (
                          <button className="btn btn-sm btn-secondary" style={{ padding: '3px 8px' }} title="Resolve" onClick={() => updateAlertStatus(alert.id, 'resolved')}>
                            <CheckCheck size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
