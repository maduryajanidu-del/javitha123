'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import OverviewPage from '@/components/pages/OverviewPage';
import LiveMonitorPage from '@/components/pages/LiveMonitorPage';
import DetectionsPage from '@/components/pages/DetectionsPage';
import AnalyticsPage from '@/components/pages/AnalyticsPage';
import CamerasPage from '@/components/pages/CamerasPage';
import AlertsPage from '@/components/pages/AlertsPage';
import SettingsPage from '@/components/pages/SettingsPage';
import { useWebSocket } from '@/lib/websocket';

export default function Home() {
  const [activePage, setActivePage] = useState('overview');
  const { isConnected, lastMessage } = useWebSocket();
  const [alertCount, setAlertCount] = useState(3);

  useEffect(() => {
    if (lastMessage?.type === 'new_detection') {
      setAlertCount(prev => prev + 1);
    }
  }, [lastMessage]);

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage lastMessage={lastMessage} />;
      case 'live':
        return <LiveMonitorPage lastMessage={lastMessage} />;
      case 'detections':
        return <DetectionsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'cameras':
        return <CamerasPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage lastMessage={lastMessage} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="main-content">
        <Header
          isConnected={isConnected}
          alertCount={alertCount}
          onAlertClick={() => setActivePage('alerts')}
        />
        <div className="page-content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
