import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Sliders, Activity, Cpu, Layers, BarChart3, Sparkles } from 'lucide-react';
import controlhubImg from '../assets/controlhub.png';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleLiveDashboardClick = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const isAuthenticated = !!(token || user);

    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login', {
        state: {
          from: '/dashboard',
          message: 'Please sign in to access the Live Dashboard.',
        },
      });
    }
  };

  return (
    <div className="landing-page-wrapper">
      {/* Full-Bleed Hero Section with controlhub.png Background & Gradient Overlay */}
      <section
        className="hero-section"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.85)), url(${controlhubImg})`,
        }}
      >
        <div className="hero-content">
          {/* Badge: Smart Home Ecosystem */}
          <div className="hero-badge">
            <span className="status-pulse-dot" style={{ width: 7, height: 7 }} />
            <span>Smart Home Ecosystem</span>
          </div>

          {/* Title */}
          <h1 className="hero-title">
            Centralized Control & <span className="hero-title-highlight">Real-Time Energy Intelligence</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle">
            Monitor appliances, schedule automation, track live power usage, and eliminate energy waste across your home.
          </p>

          {/* CTAs */}
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg" title="Register an account">
              <span>Get Started</span>
              <ArrowRight size={16} strokeWidth={2.4} />
            </Link>
            <Link to="/login" className="btn btn-hero-secondary btn-lg" title="Sign in to ControlHub">
              <span>Sign In</span>
            </Link>
            <button
              type="button"
              onClick={handleLiveDashboardClick}
              className="btn btn-hero-secondary btn-lg"
              title="Access Live Dashboard"
              style={{ cursor: 'pointer' }}
            >
              <span>Live Dashboard</span>
            </button>
          </div>
        </div>
      </section>

      {/* Content Section with Seamless Glassmorphic Transition Below Hero */}
      <div className="page-container" style={{ marginTop: '-4rem', position: 'relative', zIndex: 10 }}>
        {/* Glassmorphic Metric Preview Strip */}
        <div
          className="glass-card"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            padding: '1.75rem 2rem',
            marginBottom: '3.5rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Telemetry Latency
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.2rem 0' }}>
              &lt; 20 ms
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--status-active-text)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span className="status-pulse-dot" style={{ width: 5, height: 5 }} /> WebSocket Synced
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Peak Efficiency
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.2rem 0' }}>
              99.98%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Zero-jitter relay uptime
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Energy Tracked
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.2rem 0' }}>
              4.2 MWh
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Live telemetry load
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Protocol Support
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--primary)', margin: '0.2rem 0' }}>
              REST / MQTT
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Hardware agnostic
            </div>
          </div>
        </div>

        {/* Feature Highlights Section */}
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
              Intelligent Infrastructure for Modern Living
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto' }}>
              Seamlessly monitor appliances, isolate high-draw equipment, and optimize power consumption across your entire home.
            </p>
          </div>

          <div className="grid-3">
            {/* Feature Card 1 */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.15rem',
                }}
              >
                <Zap size={22} strokeWidth={2.2} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
                Real-Time Energy Intelligence
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Live wattage feedback and power draw categorization help detect energy spikes before they impact your utility bill.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--status-active-bg)',
                  color: 'var(--status-active-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.15rem',
                }}
              >
                <Layers size={22} strokeWidth={2.2} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
                Multi-Zone Appliance Management
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Categorize devices into Living Room, Bedroom, Kitchen, Balcony, or Garage zones for rapid single-click toggling.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.15rem',
                }}
              >
                <Shield size={22} strokeWidth={2.2} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
                Reliable Offline Synchronization
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                State caching guarantees zero interruption to your telemetry readings and smart controls even during network drops.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
