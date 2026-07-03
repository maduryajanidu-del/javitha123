'use client';

import {
  LayoutDashboard, MonitorPlay, Scan, BarChart3,
  Camera, Bell, Settings, MapPin, FileText, Train
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'live', label: 'Live Monitor', icon: MonitorPlay },
  { id: 'detections', label: 'Detections', icon: Scan },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'cameras', label: 'Cameras', icon: Camera },
];

const systemItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Train size={20} />
        </div>
        <div>
          <div className="sidebar-logo-text">LogicLane</div>
          <div className="sidebar-logo-sub">Railway AI</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-label">Monitoring</div>
          {navItems.map((item) => (
            <a
              key={item.id}
              className={`sidebar-link ${activePage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <item.icon className="sidebar-link-icon" size={20} />
              <span>{item.label}</span>
            </a>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">System</div>
          {systemItems.map((item) => (
            <a
              key={item.id}
              className={`sidebar-link ${activePage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <item.icon className="sidebar-link-icon" size={20} />
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </nav>

      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-primary)',
        fontSize: '11px',
        color: 'var(--text-muted)',
      }}>
        v1.0.0 • AI Powered
      </div>
    </aside>
  );
}
