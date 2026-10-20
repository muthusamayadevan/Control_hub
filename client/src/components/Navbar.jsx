import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Cpu, Search, Plus, LogOut, ChevronDown, Shield } from 'lucide-react';

/**
 * Helper function to extract user initials from name or user object.
 * - Extracts first letter of the first and last name (e.g. "Muthu Devan" -> "MD", "Samaya" -> "S").
 * - If no name exists, falls back to the first letter of the email address.
 * - If user is null/undefined or neither exists, defaults gracefully to 'U'.
 *
 * @param {string|object} name - User's full name or user object
 * @param {string} [email] - User's email address
 * @returns {string} Initials (e.g. "MD", "S", "U")
 */
export function getInitials(name, email) {
  // Support passing user object directly: getInitials(user)
  if (name && typeof name === 'object') {
    email = email || name.email;
    name = name.name || name.fullName;
  }

  if (name && typeof name === 'string') {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const firstInitial = parts[0].charAt(0);
      const lastInitial = parts[parts.length - 1].charAt(0);
      return `${firstInitial}${lastInitial}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].charAt(0).toUpperCase();
    }
  }

  // Fallback to first letter of email address
  if (email && typeof email === 'string') {
    const cleanEmail = email.trim();
    if (cleanEmail.length > 0) {
      return cleanEmail.charAt(0).toUpperCase();
    }
  }

  // Safe fallback default
  return 'U';
}

/**
 * Helper to safely decode a JWT token payload without external libraries.
 */
function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/dashboard';

  const searchInputRef = useRef(null);
  const profileMenuRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeBreadcrumb, setActiveBreadcrumb] = useState('Overview');
  const [authVersion, setAuthVersion] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  // Reactively listen for storage and custom auth state changes
  useEffect(() => {
    const syncAuth = () => {
      setAuthVersion((v) => v + 1);
    };
    window.addEventListener('storage', syncAuth);
    window.addEventListener('controlhub-auth-change', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('controlhub-auth-change', syncAuth);
    };
  }, []);

  // Compute auth state directly from localStorage, JWT decoding, and route changes
  const authState = useMemo(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    let userObj = null;

    if (storedUser) {
      try {
        userObj = JSON.parse(storedUser);
      } catch {
        userObj = { name: storedUser };
      }
    }

    // Fall back to decoding JWT token payload if storedUser is missing fields
    if ((!userObj || !userObj.name) && token) {
      const decoded = decodeJwt(token);
      if (decoded) {
        userObj = {
          name: decoded.name || decoded.fullName || decoded.username,
          email: decoded.email,
          role: decoded.role,
          ...userObj,
        };
      }
    }

    return {
      isAuthenticated: !!(token || storedUser),
      user: userObj,
    };
  }, [authVersion, location.pathname]);

  // Handle Ctrl+K shortcut to focus search when search bar is visible on /dashboard
  useEffect(() => {
    if (!isDashboard || !authState.isAuthenticated) return;
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDashboard, authState.isAuthenticated]);

  // Listen for active room updates from Dashboard
  useEffect(() => {
    const handleRoomChange = (e) => {
      if (e.detail?.room) {
        setActiveBreadcrumb(e.detail.room === 'all' ? 'All Devices' : e.detail.room);
      }
    };
    window.addEventListener('controlhub-room-changed', handleRoomChange);
    return () => window.removeEventListener('controlhub-room-changed', handleRoomChange);
  }, []);

  // Dispatch search query to dashboard without triggering page redirects
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    window.dispatchEvent(new CustomEvent('controlhub-search', { detail: { query } }));
  };

  const handleAddDeviceClick = () => {
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('controlhub-open-add-device'));
      }, 100);
    } else {
      window.dispatchEvent(new CustomEvent('controlhub-open-add-device'));
    }
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('controlhub-auth-change'));
    navigate('/login');
  };

  const user = authState.user;
  const userName = user?.name || user?.fullName || 'ControlHub User';
  const userEmail = user?.email || 'Authenticated Account';
  const userRole = user?.role || 'Administrator';
  const initials = getInitials(user?.name || user?.fullName, user?.email);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo & Dynamic Navigation Links */}
        <div className="brand-group">
          <Link
            to={authState.isAuthenticated ? '/dashboard' : '/'}
            className="brand-logo"
            title="ControlHub Home"
          >
            <div className="brand-icon">
              <Cpu size={18} strokeWidth={2.2} />
            </div>
            <span>ControlHub</span>
          </Link>

          {/* Conditional Navigation Links: "Home" for guest, "Dashboard" for authenticated */}
          <nav className="nav-links">
            {!authState.isAuthenticated ? (
              <Link
                to="/"
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                Home
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                Dashboard
              </Link>
            )}
          </nav>

          {authState.isAuthenticated && isDashboard && (
            <div className="nav-breadcrumb">
              <span className="nav-breadcrumb-sep">/</span>
              <span className="nav-breadcrumb-current">{activeBreadcrumb}</span>
            </div>
          )}
        </div>

        {/* Central Search Bar: ONLY VISIBLE ON /dashboard ROUTE */}
        {isDashboard && (
          <div className="nav-search-bar">
            <Search size={15} className="nav-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search appliances, rooms..."
              className="nav-search-input"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
            />
            <kbd className="kbd-shortcut">Ctrl K</kbd>
          </div>
        )}

        {/* Right-aligned Navigation Actions */}
        <div className="nav-actions">
          {!authState.isAuthenticated ? (
            /* GUEST MODE: Show ONLY "Sign In" and "Register" buttons */
            <>
              <Link
                to="/login"
                className="btn btn-secondary btn-sm"
                title="Sign In to your account"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                title="Create an account"
              >
                Register
              </Link>
            </>
          ) : (
            /* LOGGED IN MODE: Show "+ Add Device", Profile Avatar Dropdown, and "Logout" option */
            <>
              <button
                type="button"
                onClick={handleAddDeviceClick}
                className="btn btn-primary btn-sm"
                title="Register a new smart device"
              >
                <Plus size={15} strokeWidth={2.2} />
                <span>+ Add Device</span>
              </button>

              {/* Profile Avatar Badge with Hover Tooltip & Dropdown Menu */}
              <div
                className="profile-dropdown-wrapper"
                ref={profileMenuRef}
                style={{ position: 'relative' }}
              >
                <button
                  type="button"
                  className="user-avatar-btn"
                  title={`${userName} (${userEmail})`}
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.2rem',
                    cursor: 'pointer',
                  }}
                >
                  <span>{initials}</span>
                </button>

                {/* Profile Details Dropdown Card */}
                {isProfileOpen && (
                  <div
                    className="card profile-dropdown-popover"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 10px)',
                      width: '260px',
                      zIndex: 100,
                      padding: '1rem',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-surface, #ffffff)',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      textAlign: 'left',
                    }}
                  >
                    {/* User Identity Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        paddingBottom: '0.75rem',
                        borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
                      }}
                    >
                      <div
                        className="user-avatar-btn"
                        style={{
                          width: '38px',
                          height: '38px',
                          fontSize: '0.875rem',
                          flexShrink: 0,
                          boxShadow: 'none',
                        }}
                      >
                        {initials}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: 'var(--text-main, #0f172a)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={userName}
                        >
                          {userName}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted, #64748b)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={userEmail}
                        >
                          {userEmail}
                        </div>
                      </div>
                    </div>

                    {/* Role / Environment Status Badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        padding: '0 0.15rem',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>Access Tier</span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '9999px',
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          textTransform: 'capitalize',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <Shield size={11} strokeWidth={2.5} />
                        {userRole}
                      </span>
                    </div>

                    {/* Quick Link: Open Dashboard */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/dashboard');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        gap: '0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      <Cpu size={14} />
                      <span>Open Live Dashboard</span>
                    </button>

                    {/* Dropdown Logout Action */}
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
                      title="Sign out of ControlHub"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Logout Option in Navbar Actions */}
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Sign out of ControlHub"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
