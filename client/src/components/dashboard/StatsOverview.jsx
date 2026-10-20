import React from 'react';
import { Zap, Cpu, Layers, Activity, RefreshCw } from 'lucide-react';

export default function StatsOverview({
  appliances = [],
  totalDevices = 0,
  activeDevices = 0,
  totalPower = 0,
  isOnline = true,
  onSync,
  isSyncing = false,
}) {
  // Format power reading: kW
  const formattedPowerKw = (totalPower / 1000).toFixed(2);

  // Compute active vs total rooms
  const allRooms = Array.from(new Set(appliances.map((a) => a.room).filter(Boolean)));
  const totalRoomsCount = allRooms.length || 4;
  const activeRooms = Array.from(
    new Set(appliances.filter((a) => a.status).map((a) => a.room).filter(Boolean))
  );
  const activeRoomsCount = activeRooms.length;

  return (
    <section className="top-metric-ribbon" aria-label="Live System Telemetry">
      {/* Card 1: Real-time Power Consumption (kW) */}
      <div className="card stat-card metric-glass-tile">
        <div className="metric-tile-header">
          <span className="metric-tile-label">Power Consumption</span>
          <div
            className="metric-tile-icon"
            style={{
              background: '#EFF6FF',
              borderColor: '#BFDBFE',
              color: '#2563EB',
            }}
          >
            <Zap size={17} strokeWidth={2.6} />
          </div>
        </div>
        <div>
          <div className="metric-tile-value">
            {formattedPowerKw} <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569' }}>kW</span>
          </div>
          <div className="metric-tile-sub">
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#10B981',
                display: 'inline-block',
              }}
            />
            <span style={{ color: '#334155', fontWeight: 500 }}>Instantaneous total draw</span>
          </div>
        </div>
      </div>

      {/* Card 2: Active Devices */}
      <div className="card stat-card metric-glass-tile">
        <div className="metric-tile-header">
          <span className="metric-tile-label">Active Devices</span>
          <div
            className="metric-tile-icon"
            style={{
              background: '#ECFDF5',
              borderColor: '#A7F3D0',
              color: '#059669',
            }}
          >
            <Cpu size={17} strokeWidth={2.6} />
          </div>
        </div>
        <div>
          <div className="metric-tile-value">
            {activeDevices}{' '}
            <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569' }}>
              / {totalDevices} On
            </span>
          </div>
          <div className="metric-tile-sub">
            <span style={{ color: '#334155', fontWeight: 500 }}>
              {totalDevices > 0
                ? `${Math.round((activeDevices / totalDevices) * 100)}% active load ratio`
                : 'No registered devices'}
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Live Gateway Status */}
      <div className="card stat-card metric-glass-tile">
        <div className="metric-tile-header">
          <span className="metric-tile-label">Live Status</span>
          <div
            className="metric-tile-icon"
            style={{
              background: isOnline ? '#ECFDF5' : '#FEF3C7',
              borderColor: isOnline ? '#A7F3D0' : '#FDE68A',
              color: isOnline ? '#059669' : '#D97706',
            }}
          >
            <Activity size={17} strokeWidth={2.6} />
          </div>
        </div>
        <div>
          <div
            className="metric-tile-value"
            style={{
              fontSize: '1.35rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isOnline ? '#10B981' : '#F59E0B',
              }}
            />
            {isOnline ? 'Online & Synced' : 'Local Standby'}
          </div>
          <div className="metric-tile-sub" style={{ justifyContent: 'space-between' }}>
            <span style={{ color: '#334155', fontWeight: 500 }}>Low Latency Telemetry</span>
            {onSync && (
              <button
                type="button"
                onClick={onSync}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <RefreshCw size={12} className={isSyncing ? 'spin' : ''} />
                Sync
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card 4: Active Zones */}
      <div className="card stat-card metric-glass-tile">
        <div className="metric-tile-header">
          <span className="metric-tile-label">Active Zones</span>
          <div
            className="metric-tile-icon"
            style={{
              background: '#F5F3FF',
              borderColor: '#DDD6FE',
              color: '#7C3AED',
            }}
          >
            <Layers size={17} strokeWidth={2.6} />
          </div>
        </div>
        <div>
          <div className="metric-tile-value">
            {activeRoomsCount}{' '}
            <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#475569' }}>
              / {totalRoomsCount} Zones
            </span>
          </div>
          <div className="metric-tile-sub">
            <span style={{ color: '#334155', fontWeight: 500 }}>Powered living spaces</span>
          </div>
        </div>
      </div>
    </section>
  );
}
