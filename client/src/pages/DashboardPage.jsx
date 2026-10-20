import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopRoomBar from '../components/dashboard/TopRoomBar';
import StatsOverview from '../components/dashboard/StatsOverview';
import ApplianceCard from '../components/dashboard/ApplianceCard';
import PowerTelemetryGauge from '../components/dashboard/PowerTelemetryGauge';
import ScheduleAlertPanel from '../components/dashboard/ScheduleAlertPanel';
import AddDeviceModal from '../components/dashboard/AddDeviceModal';
import SettingsModal from '../components/dashboard/SettingsModal';
import { SlidersHorizontal, Plus, RefreshCw, Zap, ShieldAlert, MailCheck, X, AlertTriangle } from 'lucide-react';
import api, {
  fetchAppliances,
  toggleApplianceStatus,
  createAppliance,
  deleteAppliance,
  checkBackendStatus,
  INITIAL_DUMMY_DEVICES,
} from '../services/api';

export default function DashboardPage() {
  const [appliances, setAppliances] = useState(INITIAL_DUMMY_DEVICES);
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavTab, setActiveNavTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [proactiveAlert, setProactiveAlert] = useState(null);
  const [errorToast, setErrorToast] = useState(null);

  const alertTimeoutRef = useRef(null);
  const errorToastTimeoutRef = useRef(null);
  const isTogglingRef = useRef(false);
  const pausePollingUntilRef = useRef(0);

  const schedulerRef = useRef(null);
  const telemetryRef = useRef(null);
  const devicesRef = useRef(null);

  // Load telemetry data from API or localStorage (initial load with spinner toggle)
  const loadData = async () => {
    setIsLoading(true);
    try {
      const health = await checkBackendStatus();
      setIsBackendOnline(health.online);

      const result = await fetchAppliances();
      if (result.data && result.data.length > 0) {
        if (!isTogglingRef.current && Date.now() >= pausePollingUntilRef.current) {
          setAppliances(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to load telemetry data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Background polling for real-time telemetry updates without state overwrites during toggles
  const pollTelemetryData = async () => {
    // State guard: DO NOT poll or overwrite state while a toggle request is pending or during polling pause window
    if (isTogglingRef.current || Date.now() < pausePollingUntilRef.current) {
      return;
    }
    try {
      const health = await checkBackendStatus();
      setIsBackendOnline(Boolean(health?.online));

      if (isTogglingRef.current || Date.now() < pausePollingUntilRef.current) {
        return;
      }

      const result = await fetchAppliances();
      if (result && Array.isArray(result.data)) {
        if (isTogglingRef.current || Date.now() < pausePollingUntilRef.current) {
          return;
        }
        setAppliances(result.data);
      }
    } catch (err) {
      console.error('[TelemetryPolling] Graceful fallback during telemetry poll:', err?.message || err);
    }
  };

  useEffect(() => {
    loadData();

    // Set up lightweight real-time polling interval (every 4 seconds)
    const pollInterval = setInterval(() => {
      pollTelemetryData();
    }, 4000);

    return () => clearInterval(pollInterval);
  }, []);

  // Listen for global navbar search or add events if triggered elsewhere
  useEffect(() => {
    const handleNavbarSearch = (e) => {
      setSearchQuery(e.detail?.query || '');
    };
    const handleNavbarAdd = () => {
      setIsAddModalOpen(true);
    };

    window.addEventListener('controlhub-search', handleNavbarSearch);
    window.addEventListener('controlhub-open-add-device', handleNavbarAdd);

    return () => {
      window.removeEventListener('controlhub-search', handleNavbarSearch);
      window.removeEventListener('controlhub-open-add-device', handleNavbarAdd);
    };
  }, []);

  // Sidebar Navigation Action Dispatcher
  const handleNavTabChange = (tabId) => {
    setActiveNavTab(tabId);

    if (tabId === 'dashboard') {
      setSelectedRoom('all');
      setSearchQuery('');
      setIsAlertsOpen(false);
      devicesRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'analytics') {
      setIsAlertsOpen(false);
      telemetryRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'devices') {
      setSelectedRoom('all');
      setIsAlertsOpen(false);
      devicesRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'scheduler') {
      setIsAlertsOpen(false);
      schedulerRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'alerts') {
      setIsAlertsOpen((prev) => !prev);
    } else if (tabId === 'settings') {
      setIsSettingsOpen(true);
    }
  };

  // Compute metrics with bulletproof telemetry safety
  const totalDevices = appliances.length;
  const activeDevices = appliances.filter((a) => a?.status).length;
  const totalPower = appliances.reduce((sum, appliance) => {
    if (!appliance || !appliance.status) return sum;
    const activePower = appliance.status
      ? Number(appliance.currentPower ?? appliance.ratedPower ?? appliance.powerUsage ?? 0)
      : 0;
    const intensityFactor = appliance.intensity !== undefined ? (0.3 + 0.7 * (appliance.intensity / 100)) : 1;
    const safeWattage = isNaN(activePower) ? 0 : activePower;
    return sum + Math.round(safeWattage * intensityFactor);
  }, 0);

  // Multi-tier filtering: Room + Search Query + Analytics Mode
  const filteredAppliances = appliances.filter((appliance) => {
    // Analytics view mode: highlight high-draw or active drawing appliances
    if (activeNavTab === 'analytics') {
      if (!appliance.status && (Number(appliance.powerUsage) || 0) < 500) {
        return false;
      }
    }

    // 1. Room filter
    if (selectedRoom !== 'all') {
      const appRoom = (appliance.room || '').toLowerCase();
      const targetRoom = selectedRoom.toLowerCase();
      if (targetRoom === 'bedroom') {
        if (!appRoom.includes('bedroom')) return false;
      } else if (!appRoom.includes(targetRoom) && appRoom !== targetRoom) {
        return false;
      }
    }

    // 2. Search Query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (appliance.name || '').toLowerCase().includes(q);
      const matchRoom = (appliance.room || '').toLowerCase().includes(q);
      const matchType = (appliance.type || '').toLowerCase().includes(q);
      if (!matchName && !matchRoom && !matchType) return false;
    }

    return true;
  });

  // Toggle appliance status with optimistic updates, server sync, error reversion & 3s polling pause
  // Toggle appliance status with optimistic updates, server sync, error reversion & 3s polling pause
  const handleToggleAppliance = (applianceId, currentStatus) => {
    console.log('[FRONTEND TOGGLE CLICKED]', applianceId);

    const targetAppliance = appliances.find((a) => (a._id === applianceId || a.id === applianceId));
    const effectiveCurrentStatus = currentStatus !== undefined ? currentStatus : Boolean(targetAppliance?.status);
    const isTurningOn = !effectiveCurrentStatus;

    // Pause background polling briefly for 3 seconds to prevent race conditions
    pausePollingUntilRef.current = Date.now() + 3000;
    isTogglingRef.current = true;
    setIsToggling(true);

    // 1. Optimistically update UI state immediately
    setAppliances((prev) =>
      prev.map((a) => (a._id === applianceId || a.id === applianceId ? { ...a, status: isTurningOn } : a))
    );

    // 2. Dispatch PATCH /api/appliances/${applianceId}/toggle request via configured api Axios instance
    api.patch(`/appliances/${applianceId}/toggle`, { status: isTurningOn })
      .then((res) => {
        console.log('[TOGGLE SUCCESS RESPONSE]', res.data);
        if (res.data && res.data.data) {
          setAppliances((prev) =>
            prev.map((a) => (a._id === applianceId || a.id === applianceId ? { ...a, ...res.data.data } : a))
          );
        }

        // Handle proactive safety alert notification check
        if (isTurningOn && targetAppliance) {
          const ratedPower = Number(targetAppliance.powerUsage || targetAppliance.ratedPower || 0);
          const isHighDraw = ratedPower >= 1000;
          const currentActiveTotal = appliances
            .filter((a) => a.status && a._id !== applianceId && a.id !== applianceId)
            .reduce((sum, a) => sum + (Number(a.powerUsage || a.ratedPower) || 0), 0);
          const newTotalLoad = currentActiveTotal + ratedPower;
          const isOverload = newTotalLoad >= 3000;

          if (isHighDraw || isOverload || res.data?.alertTriggered) {
            if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
            setProactiveAlert({
              applianceName: targetAppliance.name,
              ratedPower,
              totalLoadKw: (newTotalLoad / 1000).toFixed(2),
              isHighDraw,
              isOverload,
            });

            alertTimeoutRef.current = setTimeout(() => {
              setProactiveAlert(null);
            }, 6500);
          }
        }
      })
      .catch((err) => {
        console.error('[TOGGLE API ERROR]', err.response?.data || err.message);

        // 4. On failure, revert specific appliance state and display error toast
        setAppliances((prev) =>
          prev.map((a) => (a._id === applianceId || a.id === applianceId ? { ...a, status: effectiveCurrentStatus } : a))
        );

        if (errorToastTimeoutRef.current) clearTimeout(errorToastTimeoutRef.current);
        setErrorToast(`Failed to update ${targetAppliance?.name || 'appliance'}. Reverting state.`);
        errorToastTimeoutRef.current = setTimeout(() => {
          setErrorToast(null);
        }, 4000);
      })
      .finally(() => {
        isTogglingRef.current = false;
        setIsToggling(false);
      });
  };

  const handleToggle = handleToggleAppliance;

  // Intensity slider adjustments
  const handleIntensityChange = (id, intensity) => {
    setAppliances((prev) =>
      prev.map((a) => (a._id === id ? { ...a, intensity, status: intensity > 0 } : a))
    );
  };

  // Add new device
  const handleAddAppliance = async (newDevice) => {
    const res = await createAppliance(newDevice);
    if (res.data) {
      setAppliances((prev) => [res.data, ...prev]);
    }
  };

  // Delete device
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from ControlHub?`)) {
      setAppliances((prev) => prev.filter((a) => a._id !== id));
      await deleteAppliance(id);
    }
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-layout">
        {/* 1. Left Slim Icon Sidebar Navigation */}
        <Sidebar
          activeTab={activeNavTab}
          onTabChange={handleNavTabChange}
          unreadAlertsCount={2}
          isOnline={isBackendOnline}
        />

        {/* 2. Main SaaS Minimalist Content Area */}
        <main className="vision-main" role="main">
          {/* Error Toast Notification Banner */}
          {errorToast && (
            <div
              role="alert"
              className="error-toast-banner"
              style={{
                margin: '0.85rem 1rem 0',
                padding: '0.75rem 1.15rem',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                zIndex: 100,
                animation: 'fadeIn 0.25s ease-in-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '6px',
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#991B1B' }}>
                    {errorToast}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setErrorToast(null)}
                title="Dismiss error notification"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#991B1B',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                }}
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Proactive Safety & Energy Alert Notification Banner */}
          {proactiveAlert && (
            <div
              role="alert"
              className="proactive-alert-banner"
              style={{
                margin: '0.85rem 1rem 0',
                padding: '0.75rem 1.15rem',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                zIndex: 100,
                animation: 'fadeIn 0.25s ease-in-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '6px',
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ShieldAlert size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#991B1B', letterSpacing: '-0.01em' }}>
                      Proactive Alert Dispatched to User Email
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.12rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: '#FFFFFF',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <MailCheck size={11} strokeWidth={2.5} /> Email Sent
                    </span>
                  </div>
                  <p style={{ fontSize: '0.775rem', fontWeight: 500, color: '#7F1D1D', marginTop: '0.15rem', marginBottom: 0 }}>
                    High-draw device <strong>{proactiveAlert.applianceName}</strong> ({proactiveAlert.ratedPower} W) active &bull; Total facility load: <strong>{proactiveAlert.totalLoadKw} kW</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProactiveAlert(null)}
                title="Dismiss alert banner"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#991B1B',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                }}
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Top Room Navigation Bar */}
          <TopRoomBar
            selectedRoom={selectedRoom}
            onSelectRoom={setSelectedRoom}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenAddDevice={() => setIsAddModalOpen(true)}
            unreadCount={2}
            isAlertsOpen={isAlertsOpen}
            onToggleAlerts={setIsAlertsOpen}
          />

          {/* Top Metric Widget Ribbon with High-Contrast Dark Slate Text */}
          <StatsOverview
            appliances={appliances}
            totalDevices={totalDevices}
            activeDevices={activeDevices}
            totalPower={totalPower}
            isOnline={isBackendOnline}
            onSync={loadData}
            isSyncing={isLoading}
          />

          {/* 2-Column Content Split: Devices Grid on Left, Gauge & Schedules on Right */}
          <div className="dashboard-content-grid">
            {/* Left Column: Device Control Cards */}
            <section className="devices-section-col" ref={devicesRef}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.25rem 0.5rem',
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: '#0F172A',
                      letterSpacing: '-0.025em',
                    }}
                  >
                    {activeNavTab === 'analytics'
                      ? 'High-Power Draw Telemetry'
                      : selectedRoom === 'all'
                      ? 'All Active Devices'
                      : `${selectedRoom.toUpperCase()} APPLIANCES`}
                  </h2>
                  <p style={{ fontSize: '0.825rem', fontWeight: 500, color: '#334155', marginTop: '0.15rem' }}>
                    {filteredAppliances.length} smart devices monitored in real time
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {activeNavTab === 'analytics' && (
                    <span
                      style={{
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: '#2563EB',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <Zap size={12} strokeWidth={2.6} /> Analytics Filter
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={loadData}
                    className="frosted-icon-btn"
                    style={{ width: 36, height: 36, borderRadius: '6px' }}
                    title="Refresh device statuses"
                  >
                    <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
                  </button>
                </div>
              </div>

              {filteredAppliances.length === 0 ? (
                <div
                  className="card"
                  style={{
                    textAlign: 'center',
                    padding: '3.5rem 1.5rem',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '8px',
                      background: '#F1F5F9',
                      color: '#0F172A',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                    }}
                  >
                    <SlidersHorizontal size={20} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.35rem' }}>
                    No matching smart appliances
                  </h3>
                  <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155', maxWidth: '380px', margin: '0 auto 1.25rem' }}>
                    No devices found matching &quot;{searchQuery || selectedRoom}&quot;. Reset your filters or register a new appliance.
                  </p>
                  <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRoom('all');
                        setSearchQuery('');
                        setActiveNavTab('dashboard');
                      }}
                      className="frosted-icon-btn"
                      style={{ width: 'auto', padding: '0.45rem 1rem', borderRadius: '6px', fontSize: '0.825rem', fontWeight: 600 }}
                    >
                      Reset Filters
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="vision-add-btn"
                    >
                      <Plus size={15} strokeWidth={2.6} />
                      <span>Add Device</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="appliances-grid">
                  {filteredAppliances.map((appliance) => (
                    <ApplianceCard
                      key={appliance._id}
                      appliance={appliance}
                      onToggle={handleToggleAppliance}
                      onDelete={handleDelete}
                      onIntensityChange={handleIntensityChange}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Right Column: Telemetry Gauge & Automation / Alerts */}
            <aside className="telemetry-sidebar-col" aria-label="Telemetry & Automations">
              {/* Circular Dial Power Telemetry Gauge Widget */}
              <div ref={telemetryRef} style={{ transition: 'all 0.3s ease' }}>
                <PowerTelemetryGauge
                  totalPower={totalPower}
                  maxCapacity={3500}
                  activeCount={activeDevices}
                />
              </div>

              {/* Schedule & Alert Panel */}
              <div ref={schedulerRef} style={{ transition: 'all 0.3s ease' }}>
                <ScheduleAlertPanel />
              </div>
            </aside>
          </div>
        </main>

        {/* Add Device Modal Dialog (Z-Index 2000) */}
        <AddDeviceModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddAppliance}
        />

        {/* Hub Settings Modal Dialog (Z-Index 2000) */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </div>
  );
}

