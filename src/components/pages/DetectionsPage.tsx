'use client';

import { useState } from 'react';
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const demoDetections = Array.from({ length: 20 }, (_, i) => ({
  id: `det-${1000 + i}`,
  time: `2026-07-0${3 - Math.floor(i / 8)} ${18 - (i % 8)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
  type: ['Person', 'Car', 'Truck', 'Bicycle', 'Dog', 'Motorcycle'][i % 6],
  camera: ['Track-01', 'Track-02', 'Platform-A', 'Bridge-01', 'Crossing-01'][i % 5],
  confidence: Number((0.65 + Math.random() * 0.33).toFixed(2)),
  severity: ['critical', 'high', 'normal', 'normal', 'low', 'high'][i % 6],
  zone: ['Railway Track A', 'Level Crossing', 'Platform Zone', 'Bridge Section', 'Track Boundary'][i % 5],
  alertSent: i % 3 !== 2,
}));

export default function DetectionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [objectFilter, setObjectFilter] = useState('');
  const [cameraFilter, setCameraFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = demoDetections.filter((d) => {
    if (severityFilter && d.severity !== severityFilter) return false;
    if (objectFilter && d.type !== objectFilter) return false;
    if (cameraFilter && d.camera !== cameraFilter) return false;
    if (searchQuery && !d.type.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !d.camera.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !d.id.includes(searchQuery)) return false;
    return true;
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Detection History</h2>
          <p className="page-subtitle">{filtered.length} detections found</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input">
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Search by type, camera, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select className="filter-select" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>

        <select className="filter-select" value={objectFilter} onChange={(e) => setObjectFilter(e.target.value)}>
          <option value="">All Objects</option>
          <option value="Person">Person</option>
          <option value="Car">Car</option>
          <option value="Truck">Truck</option>
          <option value="Bicycle">Bicycle</option>
          <option value="Dog">Dog</option>
          <option value="Motorcycle">Motorcycle</option>
        </select>

        <select className="filter-select" value={cameraFilter} onChange={(e) => setCameraFilter(e.target.value)}>
          <option value="">All Cameras</option>
          <option value="Track-01">Track-01</option>
          <option value="Track-02">Track-02</option>
          <option value="Platform-A">Platform-A</option>
          <option value="Bridge-01">Bridge-01</option>
          <option value="Crossing-01">Crossing-01</option>
        </select>
      </div>

      {/* Table */}
      <div className="panel">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Timestamp</th>
                <th>Object Type</th>
                <th>Camera</th>
                <th>Zone</th>
                <th>Confidence</th>
                <th>Severity</th>
                <th>Alert</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((det) => (
                <tr key={det.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{det.id}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{det.time}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{det.type}</td>
                  <td>{det.camera}</td>
                  <td style={{ fontSize: '12px' }}>{det.zone}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="confidence-bar">
                        <div className="confidence-bar-fill" style={{
                          width: `${det.confidence * 100}%`,
                          background: det.confidence > 0.9 ? 'var(--severity-critical)' :
                            det.confidence > 0.8 ? 'var(--severity-high)' : 'var(--severity-normal)',
                        }} />
                      </div>
                      {(det.confidence * 100).toFixed(0)}%
                    </div>
                  </td>
                  <td>
                    <span className={`severity-badge ${det.severity}`}>{det.severity}</span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '12px',
                      color: det.alertSent ? 'var(--severity-low)' : 'var(--text-muted)',
                    }}>
                      {det.alertSent ? '✓ Sent' : '—'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '3px 8px' }}>
                      <Eye size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
            <ChevronLeft size={14} />
          </button>
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              className={`pagination-btn ${currentPage === p ? 'active' : ''}`}
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </button>
          ))}
          <button className="pagination-btn" onClick={() => setCurrentPage(p => p + 1)}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
