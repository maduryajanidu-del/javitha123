'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, User } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  alertCount: number;
  onAlertClick: () => void;
}

export default function Header({ isConnected, alertCount, onAlertClick }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">Command Center</h1>
        <div className={`connection-badge ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="connection-dot" />
          {isConnected ? 'Live' : 'Offline'}
        </div>
      </div>

      <div className="header-right">
        <span className="header-time">{currentTime}</span>

        <button className="header-icon-btn" title="Search">
          <Search size={16} />
        </button>

        <button className="header-icon-btn" onClick={onAlertClick} title="Alerts">
          <Bell size={16} />
          {alertCount > 0 && (
            <span className="notification-count">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        <button className="header-icon-btn" title="Profile">
          <User size={16} />
        </button>
      </div>
    </header>
  );
}
