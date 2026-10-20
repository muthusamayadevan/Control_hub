import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Plus, X, ShieldAlert, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getInitials } from '../Navbar';

export default function TopRoomBar({
  selectedRoom = 'all',
  onSelectRoom,
  searchQuery = '',
  onSearchChange,
  onOpenAddDevice,
  unreadCount = 2,
  isAlertsOpen,
  onToggleAlerts,
}) {
  const navigate = useNavigate();
  const [internalAlertMenu, setInternalAlertMenu] = useState(false);
  const alertMenuRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleAuthChange = () => {
      try {
        const stored = localStorage.getItem('user');
        setCurrentUser(stored ? JSON.parse(stored) : null);
      } catch {
        setCurrentUser(null);
      }
    };
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('controlhub-auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('controlhub-auth-change', handleAuthChange);
    };
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isProfileOpen]);

  const handleLogout = () => {
    setIsProfileOpen(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('controlhub-auth-change'));
    navigate('/login');
  };

  // Controlled or uncontrolled alert menu
  const showAlertMenu = isAlertsOpen !== undefined ? isAlertsOpen : internalAlertMenu;
  const toggleAlertMenu = onToggleAlerts || (() => setInternalAlertMenu((prev) => !prev));

  // Close alert popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (alertMenuRef.current && !alertMenuRef.current.contains(e.target)) {
        if (onToggleAlerts) {
          if (isAlertsOpen) onToggleAlerts(false);
        } else {
          setInternalAlertMenu(false);
        }
      }
    };
    if (showAlertMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showAlertMenu, onToggleAlerts, isAlertsOpen]);

  const roomTabs = [
    { id: 'all', label: 'HOME' },
    { id: 'living room', label: 'LIVING ROOM' },
    { id: 'bedroom', label: 'BEDROOM' },
    { id: 'kitchen', label: 'KITCHEN' },
    { id: 'balcony', label: 'BALCONY' },
  ];

  const recentAlerts = [
    { id: 1, title: 'Voltage Telemetry', desc: 'All phases operating at nominal 230V.', time: '2m ago', active: false },
    { id: 2, title: 'Living Room AC', desc: 'High draw threshold reached (1.45 kW).', time: '14m ago', active: true },
    { id: 3, title: 'Gateway Sync', desc: 'Telemetry updated via WebSocket bridge.', time: '28m ago', active: false },
  ];

  return (
    <div className="top-room-bar">
      {/* Left side: Clean horizontal text tabs */}
      <nav className="room-tabs-nav" aria-label="Room Zones">
        {roomTabs.map((tab) => {
          const isActive =
            selectedRoom.toLowerCase() === tab.id.toLowerCase() ||
            (tab.id === 'bedroom' && selectedRoom.toLowerCase().includes('bedroom'));

          return (
            <button
              key={tab.id}
              type="button"
              className={`room-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectRoom && onSelectRoom(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Right side: Search, Alert Log, Profile, Add Device */}
      <div className="top-bar-actions">
        {/* Frosted Search Input */}
        <div className="frosted-search-wrapper">
          <Search size={15} className="frosted-search-icon" />
          <input
            type="text"
            placeholder="Search devices..."
            className="frosted-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange && onSearchChange('')}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* System Alert Log Flyout with Layering Fix */}
        <div style={{ position: 'relative' }} ref={alertMenuRef}>
          <button
            type="button"
            className="frosted-icon-btn"
            title="System Alert Log"
            onClick={toggleAlertMenu}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 7,
                  right: 7,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 8px #ef4444',
                }}
              />
            )}
          </button>

          {showAlertMenu && (
            <div className="alert-dropdown-popover">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.85rem',
                  paddingBottom: '0.6rem',
                  borderBottom: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ShieldAlert size={17} color="#2563EB" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                    Alert Log
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '9999px',
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#2563EB',
                  }}
                >
                  {recentAlerts.length} Recorded
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '6px',
                      backgroundColor: alert.active ? '#FEF2F2' : '#F8FAFC',
                      border: alert.active ? '1px solid #FECACA' : '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.825rem', fontWeight: 700, color: alert.active ? '#DC2626' : '#0F172A' }}>
                        {alert.title}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B' }}>{alert.time}</span>
                    </div>
                    <p style={{ fontSize: '0.775rem', fontWeight: 500, color: '#334155', marginTop: '0.25rem', lineHeight: 1.35 }}>
                      {alert.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Action Button & Dropdown */}
        <div style={{ position: 'relative' }} ref={profileMenuRef}>
          <button
            type="button"
            className="frosted-icon-btn"
            title={`${currentUser?.name || 'User'} (${currentUser?.email || 'Logged In'})`}
            onClick={() => setIsProfileOpen((prev) => !prev)}
            style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0F172A', width: 36, height: 36, borderRadius: '6px', cursor: 'pointer' }}
          >
            {getInitials(currentUser?.name, currentUser?.email)}
          </button>

          {isProfileOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '240px',
                zIndex: 100,
                padding: '0.9rem',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingBottom: '0.6rem', borderBottom: '1px solid #E2E8F0' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '6px',
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#2563EB',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getInitials(currentUser?.name, currentUser?.email)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#0F172A',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={currentUser?.name || 'User'}
                  >
                    {currentUser?.name || currentUser?.fullName || 'ControlHub User'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#64748B',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={currentUser?.email || ''}
                  >
                    {currentUser?.email || 'Active Account'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-sm"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: '#FEF2F2',
                  borderColor: '#FECACA',
                  color: '#DC2626',
                  cursor: 'pointer',
                }}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* + Add Device Action Button */}
        <button
          type="button"
          className="vision-add-btn"
          title="Register new smart appliance"
          onClick={onOpenAddDevice}
        >
          <Plus size={16} strokeWidth={2.6} />
          <span>Add Device</span>
        </button>
      </div>
    </div>
  );
}
