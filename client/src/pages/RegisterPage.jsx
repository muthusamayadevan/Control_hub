import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';
import { Cpu } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleRegister = (data) => {
    console.log('User registration:', data);
    navigate('/login', {
      state: { message: 'Account registered successfully! Please sign in with your credentials.' },
    });
  };

  return (
    <div className="page-container">
      <div className="auth-wrapper card">
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <div
              className="brand-icon"
              style={{
                width: 42,
                height: 42,
                borderRadius: 'var(--radius-md)',
              }}
            >
              <Cpu size={22} strokeWidth={2.2} />
            </div>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Create an Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Deploy unified IoT management across your facilities
          </p>
        </div>

        <RegisterForm onSubmit={handleRegister} />

        <div
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}
        >
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
