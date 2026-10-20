import React, { useState, useRef, useEffect } from 'react';
import {
  Lightbulb,
  Wind,
  Fan,
  Flame,
  Tv,
  Cpu,
  Zap,
  MoreVertical,
  Trash2,
  Power,
  Copy,
  Check,
  Sliders,
} from 'lucide-react';

export default function ApplianceCard({
  appliance,
  onToggle,
  onDelete,
  onIntensityChange,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [intensity, setIntensity] = useState(appliance?.intensity ?? (appliance?.status ? 85 : 0));
  const menuRef = useRef(null);

  if (!appliance) return null;

  const { _id, name, room, type, status, powerUsage, currentPower, ratedPower } = appliance;

  // Resolve Category Icon
  const getCategoryIcon = (categoryType) => {
    const t = (categoryType || '').toLowerCase();
    if (t.includes('light')) return Lightbulb;
    if (t.includes('ac') || t.includes('air') || t.includes('cool')) return Wind;
    if (t.includes('fan')) return Fan;
    if (t.includes('geyser') || t.includes('heat') || t.includes('boiler')) return Flame;
    if (t.includes('tv') || t.includes('media') || t.includes('screen')) return Tv;
    return Cpu;
  };

  const IconComponent = getCategoryIcon(type);

  // Close kebab menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  // Keep intensity in sync if status flips
  useEffect(() => {
    if (!status) {
      setIntensity(0);
    } else if (intensity === 0) {
      setIntensity(80);
    }
  }, [status]);

  const handleCopyId = () => {
    navigator.clipboard?.writeText(_id);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setMenuOpen(false);
    }, 1200);
  };

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setIntensity(val);
    if (!status && val > 0 && onToggle) {
      onToggle(_id, false);
    }
    if (onIntensityChange) {
      onIntensityChange(_id, val);
    }
  };

  const ratedWattage = Number(appliance?.ratedPower ?? appliance?.powerUsage ?? 0);
  const activePower = status
    ? Number(appliance?.currentPower ?? appliance?.ratedPower ?? appliance?.powerUsage ?? 0)
    : 0;
  // Calculate dynamic wattage when active based on intensity
  const dynamicWattage = status
    ? Math.round(activePower * (0.3 + 0.7 * (intensity / 100)))
    : 0;

  // Load badge classification with high-contrast colors
  const getLoadBadge = () => {
    if (ratedWattage >= 1000) {
      return { text: 'High Draw', color: '#9A3412', bg: 'rgba(254, 215, 170, 0.85)', border: '#FDBA74' };
    }
    if (ratedWattage >= 200) {
      return { text: 'Moderate Draw', color: '#1E40AF', bg: 'rgba(191, 219, 254, 0.85)', border: '#93C5FD' };
    }
    return { text: 'Eco / Low Draw', color: '#065F46', bg: 'rgba(167, 243, 208, 0.85)', border: '#6EE7B7' };
  };

  const loadBadge = getLoadBadge();

  // Label for slider based on device type
  const getSliderLabel = () => {
    const t = (type || '').toLowerCase();
    if (t.includes('light')) return 'Brightness';
    if (t.includes('ac') || t.includes('cool')) return 'Cooling Load';
    if (t.includes('fan')) return 'Fan Speed';
    if (t.includes('geyser') || t.includes('heat')) return 'Temp Target';
    if (t.includes('tv')) return 'Volume / Backlight';
    return 'Power Output';
  };

  return (
    <div
      className={`card appliance-card ${status ? 'active-device' : ''} ${menuOpen ? 'menu-open' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: menuOpen ? 50 : 10,
        minHeight: '235px',
        backgroundColor: '#FFFFFF',
        borderColor: status ? '#A7F3D0' : '#E2E8F0',
      }}
    >
      {/* Top Header Row: Icon + Device Title & Type + Room Badge */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 0.75rem',
            borderRadius: '6px',
            background: status ? '#ECFDF5' : '#F8FAFC',
            border: status ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
            marginBottom: '0.85rem',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Category Icon */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '6px',
                background: status ? '#D1FAE5' : '#F1F5F9',
                color: status ? '#059669' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: status ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                transition: 'all 0.15s ease',
              }}
            >
              <IconComponent size={18} strokeWidth={2.4} />
            </div>

            <div>
              <h3
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: status ? '#0F172A' : '#64748B',
                  lineHeight: 1.25,
                  letterSpacing: '-0.02em',
                }}
              >
                {name}
              </h3>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: status ? '#059669' : '#64748B',
                  textTransform: 'capitalize',
                }}
              >
                {type || 'Appliance'}
              </span>
            </div>
          </div>

          {/* Room Badge: Green badge (#059669) when ON, neutral gray when OFF */}
          <span
            style={{
              fontSize: '0.725rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: status ? '#FFFFFF' : '#F1F5F9',
              border: status ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
              color: status ? '#059669' : '#64748B',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            }}
          >
            {room || 'Living Room'}
          </span>
        </div>

        {/* Wattage & Power Load Readout */}
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: '6px',
            padding: '0.75rem 0.85rem',
            border: '1px solid #E2E8F0',
            marginBottom: '0.75rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.35rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: status ? '#0F172A' : '#64748B', fontWeight: 600 }}>
              Rated Power
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.55rem',
                borderRadius: '4px',
                color: status ? loadBadge.color : '#64748B',
                background: status ? loadBadge.bg : '#F1F5F9',
                border: status ? `1px solid ${loadBadge.border}` : '1px solid #E2E8F0',
              }}
            >
              {loadBadge.text}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
            <span
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: status ? '#0F172A' : '#64748B',
                letterSpacing: '-0.02em',
              }}
            >
              {status ? dynamicWattage : ratedWattage}
            </span>
            <span style={{ fontSize: '0.825rem', color: status ? '#334155' : '#64748B', fontWeight: 600 }}>
              Watts
            </span>

            {status && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.75rem',
                  color: '#059669',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Zap size={13} strokeWidth={2.6} /> Drawing Load
              </span>
            )}
          </div>
        </div>

        {/* Power Intensity Slider */}
        <div className="vision-slider-wrapper">
          <div className="vision-slider-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: status ? '#0F172A' : '#64748B', fontWeight: 600 }}>
              <Sliders size={13} color={status ? '#0F172A' : '#64748B'} />
              {getSliderLabel()}
            </span>
            <span style={{ color: status ? '#2563EB' : '#64748B', fontWeight: 700 }}>
              {intensity}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={intensity}
            onChange={handleSliderChange}
            className="vision-slider"
            style={{
              background: `linear-gradient(to right, #2563EB 0%, #2563EB ${intensity}%, #E2E8F0 ${intensity}%, #E2E8F0 100%)`,
            }}
          />
        </div>
      </div>

      {/* Bottom Controls: iOS Switch + Kebab Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.85rem',
          borderTop: '1px solid #E2E8F0',
          marginTop: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Active Blue Toggle Switch (#2563EB) */}
          <label
            className="ios-switch"
            title={status ? 'Turn OFF device' : 'Turn ON device'}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={Boolean(status)}
              onChange={(e) => {
                e.stopPropagation();
                if (onToggle) {
                  onToggle(appliance._id || appliance.id);
                }
              }}
            />
            <span className="ios-switch-slider" />
          </label>

          {/* Status Label */}
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              color: status ? '#059669' : '#64748B',
            }}
          >
            {status ? 'ONLINE' : 'STANDBY'}
          </span>
        </div>

        {/* Secondary Kebab Action Menu */}
        <div className="kebab-menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className="frosted-icon-btn"
            style={{ width: 32, height: 32, borderRadius: '6px' }}
            title="Device actions"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <MoreVertical size={15} color={status ? '#0F172A' : '#64748B'} />
          </button>

          {menuOpen && (
            <div className="kebab-dropdown">
              <button
                type="button"
                className="kebab-item"
                onClick={() => {
                  onToggle && onToggle(_id, status);
                  setMenuOpen(false);
                }}
              >
                <Power size={14} color="#1E293B" />
                <span>{status ? 'Turn Off' : 'Turn On'}</span>
              </button>

              <button
                type="button"
                className="kebab-item"
                onClick={handleCopyId}
              >
                {copied ? <Check size={14} color="#059669" /> : <Copy size={14} color="#1E293B" />}
                <span>{copied ? 'Copied ID' : 'Copy ID'}</span>
              </button>

              {onDelete && (
                <button
                  type="button"
                  className="kebab-item danger"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(_id, name);
                  }}
                >
                  <Trash2 size={14} />
                  <span>Delete Device</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
