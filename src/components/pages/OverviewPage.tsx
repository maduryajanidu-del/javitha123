'use client';

import { useState, useEffect } from 'react';
import {
  Scan, AlertTriangle, Camera, Activity, TrendingUp,
  ArrowUpRight, ArrowDownRight, Clock, Shield, Zap
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import type { WSMessage } from '@/lib/websocket';

interface OverviewPageProps {
  lastMessage: WSMessage | null;
}

// Demo data for the dashboard
const demoTimelineData = [
  { time: '00:00', detections: 2 }, { time: '02:00', detections: 1 },
  { time: '04:00', detections: 0 }, { time: '06:00', detections: 4 },
  { time: '08:00', detections: 12 }, { time: '10:00', detections: 18 },
  { time: '12:00', detections: 15 }, { time: '14:00', detections: 22 },
  { time: '16:00', detections: 28 }, { time: '18:00', detections: 19 },
  { time: '20:00', detections: 8 }, { time: '22:00', detections: 5 },
];

const demoObjectData = [
  { name: 'Person', value: 45, color: '#ef4444' },
  { name: 'Car', value: 23, color: '#3b82f6' },
  { name: 'Truck', value: 12, color: '#f97316' },
  { name: 'Bicycle', value: 8, color: '#22c55e' },
  { name: 'Dog', value: 5, color: '#8b5cf6' },
  { name: 'Other', value: 7, color: '#06b6d4' },
];

const demoCameraData = [
  { name: 'Laptop Webcam', count: 134 },
];

const demoRecentEvents = [
  { id: '1', time: '18:32:14', type: 'Person', severity: 'critical', camera: 'Laptop Webcam', confidence: 0.94 },
  { id: '2', time: '18:28:41', type: 'Car', severity: 'high', camera: 'Laptop Webcam', confidence: 0.87 },
  { id: '3', time: '18:15:22', type: 'Person', severity: 'critical', camera: 'Laptop Webcam', confidence: 0.91 },
  { id: '4', time: '17:52:08', type: 'Dog', severity: 'normal', camera: 'Laptop Webcam', confidence: 0.73 },
  { id: '5', time: '17:41:33', type: 'Truck', severity: 'high', camera: 'Laptop Webcam', confidence: 0.82 },
  { id: '6', time: '17:19:55', type: 'Bicycle', severity: 'normal', camera: 'Laptop Webcam', confidence: 0.78 },
  { id: '7', time: '16:58:12', type: 'Person', severity: 'critical', camera: 'Laptop Webcam', confidence: 0.96 },
  { id: '8', time: '16:44:39', type: 'Car', severity: 'high', camera: 'Laptop Webcam', confidence: 0.85 },
];

const demoSystemHealth = [
  { name: 'CPU Usage', value: '42%', status: 'good' },
  { name: 'GPU Usage', value: '68%', status: 'good' },
  { name: 'FPS', value: '24.5', status: 'good' },
  { name: 'Latency', value: '45ms', status: 'good' },
  { name: 'Memory', value: '3.2 GB', status: 'good' },
  { name: 'Network', value: '12 Mbps', status: 'good' },
];

const severityColor = (s: string) => {
  const colors: Record<string, string> = {
    low: 'var(--severity-low)', normal: 'var(--severity-normal)',
    high: 'var(--severity-high)', critical: 'var(--severity-critical)',
  };
  return colors[s] || 'var(--text-muted)';
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '12px',
      }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
        <div style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
          {payload[0].value} detections
        </div>
      </div>
    );
  }
  return null;
};

export default function OverviewPage({ lastMessage }: OverviewPageProps) {
  const [animatedCounts, setAnimatedCounts] = useState({
    detections: 0, critical: 0, cameras: 0, avgConf: 0,
  });

  useEffect(() => {
    // Animate counters on mount
    const targets = { detections: 134, critical: 12, cameras: 1, avgConf: 87 };
    const duration = 1200;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedCounts({
        detections: Math.round(targets.detections * eased),
        critical: Math.round(targets.critical * eased),
        cameras: Math.round(targets.cameras * eased),
        avgConf: Math.round(targets.avgConf * eased),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fade-in">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Detections Today</span>
            <div className="kpi-card-icon" style={{ background: 'var(--accent-blue-glow)', color: 'var(--accent-blue)' }}>
              <Scan size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{animatedCounts.detections}</div>
          <div className="kpi-card-change positive">
            <ArrowUpRight size={14} /> +12% from yesterday
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Critical Alerts</span>
            <div className="kpi-card-icon" style={{ background: 'var(--severity-critical-bg)', color: 'var(--severity-critical)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ color: 'var(--severity-critical)' }}>
            {animatedCounts.critical}
          </div>
          <div className="kpi-card-change negative">
            <ArrowUpRight size={14} /> +3 since 6 AM
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Active Cameras</span>
            <div className="kpi-card-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: 'var(--severity-low)' }}>
              <Camera size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{animatedCounts.cameras}<span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/1</span></div>
          <div className="kpi-card-change positive">
            <Activity size={14} /> All operational
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Avg Confidence</span>
            <div className="kpi-card-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: 'var(--accent-purple)' }}>
              <Zap size={18} />
            </div>
          </div>
          <div className="kpi-card-value">{animatedCounts.avgConf}%</div>
          <div className="kpi-card-change positive">
            <TrendingUp size={14} /> Model accuracy stable
          </div>
        </div>
      </div>

      {/* Main grid: Charts + Events */}
      <div className="grid-2-1" style={{ marginBottom: '16px' }}>
        {/* Detection Timeline */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <Activity size={16} /> Detection Timeline
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last 24 hours</span>
          </div>
          <div className="panel-body">
            <div className="chart-container" style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={demoTimelineData}>
                  <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="detections"
                    stroke="var(--accent-blue)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: 'var(--accent-blue)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Object Distribution */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <Shield size={16} /> Object Types
            </span>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demoObjectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {demoObjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
              {demoObjectData.map((item) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom grid: Recent Events + Camera Activity + System Health */}
      <div className="grid-3" style={{ marginBottom: '16px' }}>
        {/* Recent Events */}
        <div className="panel" style={{ gridColumn: 'span 2' }}>
          <div className="panel-header">
            <span className="panel-title">
              <Clock size={16} /> Recent Incidents
            </span>
            <button className="btn btn-sm btn-secondary">View All</button>
          </div>
          <div style={{ maxHeight: '340px', overflow: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Object</th>
                  <th>Camera</th>
                  <th>Confidence</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {demoRecentEvents.map((event) => (
                  <tr key={event.id}>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{event.time}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{event.type}</td>
                    <td>{event.camera}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="confidence-bar">
                          <div
                            className="confidence-bar-fill"
                            style={{
                              width: `${event.confidence * 100}%`,
                              background: event.confidence > 0.9 ? 'var(--severity-critical)' :
                                event.confidence > 0.8 ? 'var(--severity-high)' : 'var(--severity-normal)',
                            }}
                          />
                        </div>
                        {(event.confidence * 100).toFixed(0)}%
                      </div>
                    </td>
                    <td>
                      <span className={`severity-badge ${event.severity}`}>{event.severity}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <Activity size={16} /> System Health
            </span>
          </div>
          <div className="panel-body">
            {demoSystemHealth.map((item) => (
              <div key={item.name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid var(--border-primary)',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.name}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--severity-low)', fontVariantNumeric: 'tabular-nums' }}>
                  {item.value}
                </span>
              </div>
            ))}

            {/* Camera Activity Mini Chart */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Camera Activity
              </div>
              <div style={{ height: '120px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demoCameraData}>
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                    <Bar dataKey="count" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
