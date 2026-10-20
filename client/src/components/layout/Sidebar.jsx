import React from 'react';
import {
  LayoutGrid,
  Zap,
  Cpu,
  Clock,
  Bell,
  Settings,
  Home,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({
  activeTab = 'dashboard',
  onTabChange,
  unreadAlertsCount = 2,
  isOnline = true,
}) {
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Grid', icon: LayoutGrid, actionDescription: 'All Devices & Real-Time Telemetry' },
    { id: 'analytics', label: 'Energy Analytics', icon: Zap, actionDescription: 'High-Power Draw Telemetry' },
    { id: 'devices', label: 'Device Manager', icon: Cpu, actionDescription: 'Manage & Register Appliances' },
    { id: 'scheduler', label: 'Scheduler', icon: Clock, actionDescription: 'Automations & Timers' },
    { id: 'alerts', label: 'System Alerts', icon: Bell, badge: unreadAlertsCount, actionDescription: 'Security & Voltage Log' },
    { id: 'settings', label: 'Settings', icon: Settings, actionDescription: 'Hub Configuration' },
  ];

  const handleNavClick = (id) => {
    if (onTabChange) {
      onTabChange(id);
    }
  };

  return (
    <aside className="vision-sidebar" aria-label="Smart Hub Navigation">
      {/* Top Section: ControlHub Brand Icon Button */}
      <div className="sidebar-top">
        <button
          type="button"
          className="sidebar-brand-btn"
          title="Return to ControlHub Home"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <Home size={22} strokeWidth={2.4} />
        </button>

        {/* Vertical Icon Navigation List */}
        <nav aria-label="Main Hub Sections" style={{ width: '100%' }}>
          <ul className="sidebar-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <li key={item.id} className="sidebar-nav-item">
                  <button
                    type="button"
                    className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                    title={`${item.label} - ${item.actionDescription}`}
                    onClick={() => handleNavClick(item.id)}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    style={{ cursor: 'pointer' }}
                  >
                    <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                    {item.badge && item.badge > 0 && item.id === 'alerts' && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#EF4444',
                          boxShadow: '0 0 8px #EF4444',
                        }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Bottom Section: Connection Status Dot & Notification Bell */}
      <div className="sidebar-bottom">
        <div
          className="sidebar-status-indicator"
          title={isOnline ? 'System Online (12ms Telemetry)' : 'Offline / Standby Mode'}
        >
          <div
            className="status-dot-pulse"
            style={{
              backgroundColor: isOnline ? '#10B981' : '#F59E0B',
            }}
          />
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              color: '#334155',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {isOnline ? 'LIVE' : 'IDLE'}
          </span>
        </div>

        {/* Bell Action */}
        <button
          type="button"
          className="frosted-icon-btn"
          style={{
            width: 40,
            height: 40,
            borderRadius: '8px',
            backgroundColor: '#F8FAFC',
            borderColor: '#E2E8F0',
            color: '#334155',
            cursor: 'pointer',
          }}
          title={`${unreadAlertsCount} System Notifications`}
          onClick={() => handleNavClick('alerts')}
        >
          <Bell size={18} />
          {unreadAlertsCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 7,
                right: 7,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#38BDF8',
                boxShadow: '0 0 8px #38BDF8',
              }}
            />
          )}
        </button>
      </div>
    </aside>
  );
}
