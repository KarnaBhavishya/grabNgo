// client/src/pages/Register.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, UserPlus, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

export default function Register({ navigate, defaultRole }) {
  const { register, error: authError, setError } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(defaultRole || 'customer');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [shake, setShake] = useState(false);

  // OTP Verification States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [sentOtpCode, setSentOtpCode] = useState('');
  const [emailSentStatus, setEmailSentStatus] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend Timer Countdown
  React.useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Password Validation States
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password)
  };

  const isPasswordValid = checks.length && checks.uppercase && checks.number;

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError('');
    setError(null);

    // Initial validations
    if (!name || !email || !mobile || !password || !confirmPassword) {
      setLocalError('All fields are required.');
      triggerShake();
      return;
    }

    if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      setLocalError('Mobile number must be exactly 10 digits.');
      triggerShake();
      return;
    }

    if (!isPasswordValid) {
      setLocalError('Password does not meet all complexity requirements.');
      triggerShake();
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      // Step 1: Send OTP to the entered email / phone
      const response = await fetch('http://localhost:5000/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mobile })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to dispatch verification OTP.');
      }

      setSentOtpCode(data.tempOtp);
      setEmailSentStatus(data.emailSent);
      setShowOtpScreen(true);
      setResendCooldown(30);
      setOtpError('');
    } catch (err) {
      setLocalError(err.message || 'Error sending verification code. Please try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpError('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mobile })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification OTP.');
      }

      setSentOtpCode(data.tempOtp);
      setEmailSentStatus(data.emailSent);
      setResendCooldown(30);
      setOtpError('A new verification code has been dispatched to your email.');
    } catch (err) {
      setOtpError(err.message || 'Error resending code.');
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setOtpError('');
    if (!enteredOtp || enteredOtp.length !== 6) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setVerifyingOtp(true);
    try {
      const verifyRes = await fetch('http://localhost:5000/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: enteredOtp, expectedOtp: sentOtpCode })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.message || 'Invalid OTP code.');
      }

      // OTP matches! complete the registration
      await register(name, email, mobile, password, confirmPassword, role);
    } catch (err) {
      setOtpError(err.message || 'Incorrect verification code. Please check your email or server console.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="content-wrapper flex-center" style={{ minHeight: 'calc(100vh - 180px)', padding: '40px 16px' }}>
      <div 
        className="glass-panel animate-scale-in" 
        style={{
          display: 'flex',
          width: '100%',
          maxWidth: '900px',
          boxShadow: 'var(--glass-shadow-large)',
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl)',
          minHeight: '620px'
        }}
      >
        {/* LEFT ILLUSTATIVE SIDE - WOW FACTOR */}
        <div style={{
          flex: '1 1 50%',
          background: 'linear-gradient(135deg, var(--dark-slate) 0%, hsl(222, 47%, 20%) 100%)',
          color: 'white',
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }} className="register-promo-side">
          {/* Subtle overlay vector */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 10% 20%, rgba(255, 107, 38, 0.15) 0%, transparent 60%)',
            pointerEvents: 'none'
          }}></div>

          <div style={{ zIndex: 1 }}>
            <h3 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', marginBottom: '16px', color: 'white' }}>
              Why GrabNGo?
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  backgroundColor: 'rgba(255,107,38,0.2)',
                  color: 'var(--primary)',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  ✓
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'white', fontWeight: 600 }}>Zero Service Markups</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>Pay the exact local catalog price. No hidden service margins.</p>
                </div>
              </li>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  backgroundColor: 'rgba(56,189,248,0.2)',
                  color: '#38bdf8',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  ✓
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'white', fontWeight: 600 }}>Super-Speed Pickup</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>Your items are packed in advance. Walk in, scan QR code, and walk out.</p>
                </div>
              </li>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  backgroundColor: 'rgba(34,197,94,0.2)',
                  color: '#22c55e',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  ✓
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'white', fontWeight: 600 }}>Local Store Autonomy</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>Support your neighborhood shops while enjoying premium digital tools.</p>
                </div>
              </li>
            </ul>
          </div>

          <div style={{ zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>Already on the platform?</span>
            <button 
              onClick={() => navigate('login')} 
              className="btn btn-secondary" 
              style={{
                display: 'block',
                width: '100%',
                marginTop: '10px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'white',
                padding: '10px'
              }}
            >
              Sign In Instead
            </button>
          </div>
        </div>

        {/* RIGHT REGISTRATION FORM SIDE */}
        <div style={{
          flex: '1 1 50%',
          padding: '48px',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }} className={`register-form-side ${shake ? 'shake-animation' : ''}`}>
          {showOtpScreen ? (
            /* OTP VERIFICATION VIEW */
            <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--dark-slate)', marginBottom: '6px', fontFamily: 'var(--font-display)' }}>
                  Verify Email
                </h2>
                <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  We have dispatched a 6-digit verification code to <strong style={{ color: 'var(--primary)' }}>{email}</strong>. Please enter it below.
                </p>
              </div>

              {otpError && (
                <div className="animate-fade-in" style={{
                  backgroundColor: otpError.includes('dispatched') ? 'var(--primary-light)' : 'var(--danger-light)',
                  color: otpError.includes('dispatched') ? 'var(--primary)' : 'var(--danger)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  marginBottom: '16px',
                  borderLeft: otpError.includes('dispatched') ? '4px solid var(--primary)' : '4px solid var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>{otpError}</span>
                </div>
              )}

              {/* SMTP CONFIGURATION STATUS FEEDBACK */}
              <div style={{
                backgroundColor: 'var(--bg-main)',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                color: 'var(--slate-600)',
                lineHeight: '1.5',
                marginBottom: '20px',
                border: '1px solid var(--slate-200)'
              }}>
                {emailSentStatus ? (
                  <span style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span>✉️</span>
                    <span><strong>Real Mail Dispatched:</strong> NodeMailer successfully sent this OTP to your email inbox! Please check your inbox and spam/junk folder.</span>
                  </span>
                ) : (
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#b45309', fontWeight: 700 }}>
                      ⚠️ Developer Sandbox Active
                    </span>
                    <span>No SMTP credentials exist in the server's `.env` file. The secure 6-digit OTP code has been logged to your <strong>backend terminal console</strong>! Please check the terminal, or edit `.env` to receive real emails.</span>
                  </span>
                )}
              </div>

              <form onSubmit={handleVerifyAndRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="otp-input" style={{ fontWeight: 700 }}>Enter 6-Digit OTP</label>
                  <input
                    id="otp-input"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    className="input-field"
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      fontSize: '1.8rem',
                      letterSpacing: '0.4em',
                      fontWeight: 800,
                      padding: '12px',
                      color: 'var(--primary)',
                      textIndent: '0.2em'
                    }}
                    disabled={verifyingOtp}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={verifyingOtp || enteredOtp.length !== 6}
                    style={{ padding: '12px' }}
                  >
                    {verifyingOtp ? 'Verifying OTP...' : 'Verify & Complete Registration'}
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setShowOtpScreen(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--slate-500)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      ← Back & Edit Info
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: resendCooldown > 0 ? 'var(--slate-400)' : 'var(--primary)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                        textDecoration: resendCooldown > 0 ? 'none' : 'underline'
                      }}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            /* ORIGINAL REGISTRATION VIEW */
            <>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--dark-slate)', marginBottom: '6px', fontFamily: 'var(--font-display)' }}>
                  Create Account
                </h2>
                <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem' }}>
                  Register today for rapid local packaging.
                </p>
              </div>

              {/* ROLE SELECTOR TABS */}
              <div style={{
                display: 'flex',
                backgroundColor: 'var(--bg-main)',
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '20px'
              }}>
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    backgroundColor: role === 'customer' ? 'white' : 'transparent',
                    color: role === 'customer' ? 'var(--primary)' : 'var(--slate-600)',
                    boxShadow: role === 'customer' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  Customer Account
                </button>
                <button
                  type="button"
                  onClick={() => setRole('shopowner')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    backgroundColor: role === 'shopowner' ? 'white' : 'transparent',
                    color: role === 'shopowner' ? 'var(--primary)' : 'var(--slate-600)',
                    boxShadow: role === 'shopowner' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  Shop Owner Account
                </button>
              </div>

              {/* ERROR DISPLAY */}
              {(localError || authError) && (
                <div className="animate-fade-in" style={{
                  backgroundColor: 'var(--danger-light)',
                  color: 'var(--danger)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  marginBottom: '16px',
                  borderLeft: '4px solid var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>{localError || authError}</span>
                </div>
              )}

              {/* REGISTRATION FORM */}
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }} className="grid-mobile-single">
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="reg-name">Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                      <input
                        id="reg-name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '40px', paddingTop: '10px', paddingBottom: '10px' }}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="reg-mobile">Mobile Number</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                      <input
                        id="reg-mobile"
                        type="tel"
                        placeholder="10 digit number"
                        maxLength={10}
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '40px', paddingTop: '10px', paddingBottom: '10px' }}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="reg-email">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                    <input
                      id="reg-email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', paddingLeft: '40px', paddingTop: '10px', paddingBottom: '10px' }}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }} className="grid-mobile-single">
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="reg-password">Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '40px', paddingRight: '40px', paddingTop: '10px', paddingBottom: '10px' }}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="reg-confirm">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                      <input
                        id="reg-confirm"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '40px', paddingRight: '40px', paddingTop: '10px', paddingBottom: '10px' }}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
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
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* PASSWORD REQUIREMENTS REAL-TIME TRACKER */}
                {password && (
                  <div 
                    className="animate-fade-in" 
                    style={{ 
                      backgroundColor: 'var(--bg-main)', 
                      padding: '10px 14px', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px' 
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--slate-600)' }}>Password Strength Checks:</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: checks.length ? 'var(--secondary)' : 'var(--slate-400)' }}>
                        <Check size={12} strokeWidth={checks.length ? 3 : 2} /> 8+ Characters
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: checks.uppercase ? 'var(--secondary)' : 'var(--slate-400)' }}>
                        <Check size={12} strokeWidth={checks.uppercase ? 3 : 2} /> 1 Uppercase
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: checks.number ? 'var(--secondary)' : 'var(--slate-400)' }}>
                        <Check size={12} strokeWidth={checks.number ? 3 : 2} /> 1 Number
                      </span>
                    </div>
                  </div>
                )}

                {role === 'shopowner' && (
                  <div 
                    className="animate-slide-up" 
                    style={{ 
                      border: '1px dashed var(--primary)', 
                      backgroundColor: 'var(--primary-light)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '10px 14px',
                      fontSize: '0.8rem',
                      color: 'var(--primary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <strong>ℹ️ Registering Shop Owner Account</strong>
                    <span>Upon logging in, you will be prompted to submit your local store registration details (Name, Address, operational hours, category) for Admin approval.</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary btn-block"
                  disabled={loading}
                  style={{ marginTop: '10px', padding: '12px' }}
                >
                  {loading ? 'Processing Registration...' : (
                    <>
                      <UserPlus size={16} />
                      Register Now
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .register-promo-side {
            display: none !important;
          }
          .register-form-side {
            flex: 1 1 100% !important;
            padding: 24px !important;
          }
          .grid-mobile-single {
            grid-template-columns: 1fr !important;
          }
        }
        .shake-animation {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
