// client/src/pages/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, Shield, Store, User as UserIcon, Eye, EyeOff, Copy, X } from 'lucide-react';

export default function Login({ navigate }) {
  const { login, error: authError, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [shake, setShake] = useState(false);

  const credentialsMap = {
    customer: { email: 'customer@grabngo.com', password: 'Password123', label: 'Customer' },
    shopowner: { email: 'owner@grabngo.com', password: 'Password123', label: 'Store Owner' },
    admin: { email: 'saikoushik510@gmail.com', password: 'Koushik@123', label: 'Admin' }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    setError(null);

    if (!email || !password) {
      setLocalError('Please fill in all fields.');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const applyCredentials = (role) => {
    const creds = credentialsMap[role];
    setEmail(creds.email);
    setPassword(creds.password);
  };

  return (
    <div className="colorful-mesh-login flex-center" style={{ minHeight: 'calc(100vh - 120px)', padding: '40px 16px', width: '100vw', margin: '0 auto', marginLeft: 'calc(-50vw + 50%)' }}>
      <div className="split-layout-container">
        
        {/* Left Side: Form Pane */}
        <div className="split-layout-form-pane">
          <div 
            className={`glass-panel animate-scale-in ${shake ? 'shake-animation' : ''}`} 
            style={{
              width: '100%',
              maxWidth: '450px',
              padding: '40px 32px',
              boxShadow: 'var(--glass-shadow-large)',
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.85)'
            }}
          >
            {/* Glow Element */}
            <div style={{
              position: 'absolute',
              top: '-10%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--primary-light) 0%, rgba(255,107,38,0) 70%)',
              zIndex: -1,
              opacity: 0.8
            }}></div>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '2rem', color: 'var(--dark-slate)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
                Welcome Back
              </h2>
              <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem' }}>
                Enter your credentials to access your GrabNGo panel
              </p>
            </div>

            {/* QUICK ACCOUNTS FILL */}
            <div style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', textAlign: 'center' }}>
                Quick Account Autofill
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {['customer', 'shopowner', 'admin'].map((role) => {
                  const icons = { customer: <UserIcon size={16} />, shopowner: <Store size={16} />, admin: <Shield size={16} /> };
                  const labels = { customer: 'Customer', shopowner: 'Store Owner', admin: 'Admin' };

                  return (
                    <button 
                      key={role}
                      type="button"
                      onClick={() => applyCredentials(role)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 4px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--slate-200)',
                        backgroundColor: 'white',
                        color: 'var(--slate-600)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        transition: 'var(--transition-smooth)',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.color = 'var(--primary)';
                        e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--slate-200)';
                        e.currentTarget.style.color = 'var(--slate-600)';
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      {icons[role]}
                      <span>{labels[role]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ERROR BOX */}
            {(localError || authError) && (
              <div className="animate-fade-in" style={{
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginBottom: '20px',
                borderLeft: '4px solid var(--danger)'
              }}>
                {localError || authError}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleLogin} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                  <input 
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    autoComplete="off"
                    style={{ width: '100%', paddingLeft: '48px' }}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                  <input 
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    autoComplete="off"
                    style={{ width: '100%', paddingLeft: '48px', paddingRight: '48px' }}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--slate-400)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={loading}
                style={{ marginTop: '8px' }}
              >
                {loading ? (
                  <span className="flex-center" style={{ gap: '8px' }}>
                    <span className="shimmer-dot" style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'pulse 1s infinite alternate'
                    }}></span>
                    Authenticating...
                  </span>
                ) : (
                  <>
                    <LogIn size={18} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--slate-600)' }}>
              Don't have an account?{' '}
              <span 
                onClick={() => navigate('register')} 
                style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Register Now
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Pane */}
        <div className="split-layout-visual-pane">
          <img src="/login_banner.png" alt="GrabNGo pickup illustration" className="split-layout-image" />
          <div className="split-layout-overlay"></div>
          <div className="split-layout-caption animate-slide-up">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              padding: '6px 12px',
              borderRadius: '50px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'white',
              marginBottom: '16px',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              ⚡ Quick & Fresh pickup local
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
              Pickup Packages <br />
              <span style={{ color: 'var(--primary)' }}>In a Snap.</span>
            </h2>
            <p style={{ color: 'var(--slate-200)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '420px' }}>
              Skip the delivery queue and extra platform fees. Grab your order fresh and packed directly from your neighborhood merchant of choice.
            </p>
          </div>
        </div>

      </div>

      <style>{`
        .shake-animation {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        @keyframes pulse {
          0% { transform: scale(0.6); opacity: 0.5; }
          100% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
