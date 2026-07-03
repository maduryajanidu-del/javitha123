'use client';

import { useState } from 'react';
import {
  BarChart3, TrendingUp, PieChart as PieChartIcon,
  Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';

const hourlyTrend = [
  { h: '06', d: 4, c: 1 }, { h: '07', d: 8, c: 2 }, { h: '08', d: 15, c: 4 },
  { h: '09', d: 22, c: 5 }, { h: '10', d: 18, c: 3 }, { h: '11', d: 20, c: 4 },
  { h: '12', d: 16, c: 2 }, { h: '13', d: 14, c: 2 }, { h: '14', d: 25, c: 6 },
  { h: '15', d: 28, c: 7 }, { h: '16', d: 32, c: 8 }, { h: '17', d: 24, c: 5 },
  { h: '18', d: 19, c: 4 },
];

const weeklyTrend = [
  { day: 'Mon', detections: 85, alerts: 15 },
  { day: 'Tue', detections: 112, alerts: 22 },
  { day: 'Wed', detections: 98, alerts: 18 },
  { day: 'Thu', detections: 134, alerts: 28 },
  { day: 'Fri', detections: 105, alerts: 20 },
  { day: 'Sat', detections: 67, alerts: 10 },
  { day: 'Sun', detections: 45, alerts: 6 },
];

const objectBreakdown = [
  { name: 'Person', count: 245, pct: 38, color: '#ef4444' },
  { name: 'Car', count: 156, pct: 24, color: '#3b82f6' },
  { name: 'Truck', count: 89, pct: 14, color: '#f97316' },
  { name: 'Bicycle', count: 67, pct: 10, color: '#22c55e' },
  { name: 'Dog', count: 45, pct: 7, color: '#8b5cf6' },
  { name: 'Motorcycle', count: 34, pct: 5, color: '#06b6d4' },
  { name: 'Other', count: 10, pct: 2, color: '#6b7280' },
];

const cameraCounts = [
  { name: 'Track-01', total: 198, critical: 42 },
  { name: 'Track-02', total: 156, critical: 31 },
  { name: 'Crossing-01', total: 112, critical: 28 },
  { name: 'Platform-A', total: 89, critical: 12 },
  { name: 'Bridge-01', total: 65, critical: 8 },
  { name: 'Yard-01', total: 26, critical: 3 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '12px',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>{label}</div>
        {payload.map((item, idx) => (
          <div key={idx} style={{ color: item.color, display: 'flex', gap: '8px', marginBottom: '2px' }}>
            <span>{item.name}:</span>
            <span style={{ fontWeight: 600 }}>{item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Analytics</h2>
          <p className="page-subtitle">Detection patterns and performance insights</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              className={`btn btn-sm ${timeRange === range ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {[
          { label: 'Total Detections', value: '646', change: '+12%', positive: true },
          { label: 'Critical Events', value: '124', change: '+8%', positive: false },
          { label: 'Avg Confidence', value: '87.3%', change: '+2.1%', positive: true },
          { label: 'Alert Rate', value: '92%', change: '+5%', positive: true },
          { label: 'Top Camera', value: 'Track-01', change: '198 events', positive: true },
        ].map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <div className="kpi-card-label" style={{ marginBottom: '8px' }}>{kpi.label}</div>
            <div className="kpi-card-value" style={{ fontSize: '24px' }}>{kpi.value}</div>
            <div className={`kpi-card-change ${kpi.positive ? 'positive' : 'negative'}`}>
              {kpi.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {kpi.change}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Hourly Trend + Weekly Trend */}
      <div className="chart-grid" style={{ marginBottom: '16px' }}>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <TrendingUp size={16} /> Hourly Detection Trend
            </span>
          </div>
          <div className="panel-body">
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyTrend}>
                  <defs>
                    <linearGradient id="gradDetections" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCritical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="h" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="d" name="Detections" stroke="#3b82f6" fill="url(#gradDetections)" strokeWidth={2} />
                  <Area type="monotone" dataKey="c" name="Critical" stroke="#ef4444" fill="url(#gradCritical)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <Calendar size={16} /> Weekly Overview
            </span>
          </div>
          <div className="panel-body">
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrend}>
                  <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="detections" name="Detections" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="alerts" name="Alerts" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Object Types + Camera Distribution */}
      <div className="chart-grid">
        {/* Object Breakdown */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <PieChartIcon size={16} /> Detection by Object Type
            </span>
          </div>
          <div className="panel-body">
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ width: '200px', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={objectBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {objectBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1 }}>
                {objectBreakdown.map((item) => (
                  <div key={item.name} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '6px 0', borderBottom: '1px solid var(--border-primary)',
                  }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)' }}>{item.name}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {item.count}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '36px', textAlign: 'right' }}>
                      {item.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Camera Distribution */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">
              <BarChart3 size={16} /> Detection by Camera
            </span>
          </div>
          <div className="panel-body">
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cameraCounts} layout="vertical">
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
                  <Bar dataKey="critical" name="Critical" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
