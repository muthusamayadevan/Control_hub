import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/layout/Footer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

/**
 * ProtectedRoute component wrapper.
 * Restricts access to authenticated users. If an unauthenticated guest attempts
 * to access a protected route, they are automatically redirected to /login.
 */
export function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const isAuthenticated = !!(token || user);

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname,
          message: 'Please sign in to access the Live Dashboard.',
        }}
        replace
      />
    );
  }

  return children;
}

export default function App() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className={`app-container ${isDashboard ? 'dashboard-mode' : ''}`}>
      {/* Persistent Navigation Header (Hidden on visionOS Smart Hub for full immersion) */}
      {!isDashboard && <Navbar />}

      {/* Main Multi-Page Routed View */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Persistent Footer */}
      {!isDashboard && <Footer />}
    </div>
  );
}
