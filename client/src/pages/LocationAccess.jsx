// client/src/pages/LocationAccess.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from '../context/LocationContext';
import { MapPin, Navigation, Search, Check, ChevronRight } from 'lucide-react';

export default function LocationAccess({ navigate }) {
  const { location, isLocationSet, loading, error, requestGPSLocation, setManualLocation, resetLocation } = useLocation();
  const [searchVal, setSearchVal] = useState('');
  const [success, setSuccess] = useState(false);
  const [newlySelected, setNewlySelected] = useState(false);

  const presets = [
    { name: 'Indiranagar, Bengaluru', key: 'Indiranagar' },
    { name: 'Malleswaram, Bengaluru', key: 'Malleswaram' },
    { name: 'Whitefield, Bengaluru', key: 'Whitefield' }
  ];

  // Reset location state on mount so user can pick a new location
  useEffect(() => {
    resetLocation();
  }, []);

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    setManualLocation(searchVal);
    setNewlySelected(true);
  };

  const handlePresetSelect = (presetKey) => {
    setSearchVal(presetKey);
    setManualLocation(presetKey);
    setNewlySelected(true);
  };

  // Triggers success animation before routing — only when user made a fresh selection
  useEffect(() => {
    if (isLocationSet && newlySelected) {
      setSuccess(true);
      const timer = setTimeout(() => {
        navigate('home');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLocationSet, newlySelected, navigate]);

  return (
    <div className="content-wrapper flex-center" style={{ minHeight: 'calc(100vh - 180px)', padding: '40px 16px' }}>
      <div 
        className="glass-panel animate-scale-in" 
        style={{
          width: '100%',
          maxWidth: '850px',
          display: 'flex',
          boxShadow: 'var(--glass-shadow-large)',
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl)',
          minHeight: '520px'
        }}
      >
        {/* LEFT COLUMN: INTERACTIVE MOCK MAP */}
        <div style={{
          flex: '1 1 45%',
          background: '#f1f5f9',
          borderRight: '1px solid var(--slate-200)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }} className="location-map-side">
          
          {/* Dynamic Interactive Vector Map (Simulated premium look) */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0.8,
            transition: 'var(--transition-smooth)',
            transform: success ? 'scale(1.15)' : 'scale(1)'
          }}>
            {/* SVG MOCK MAP LINES */}
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ backgroundColor: '#e2e8f0' }}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Roads */}
              <path d="M-50 150 Q 150 120 450 180" fill="none" stroke="white" strokeWidth="24" strokeLinecap="round" />
              <path d="M-50 150 Q 150 120 450 180" fill="none" stroke="#cbd5e1" strokeWidth="20" strokeLinecap="round" />
              
              <path d="M120 -50 L 180 450" fill="none" stroke="white" strokeWidth="18" strokeLinecap="round" />
              <path d="M120 -50 L 180 450" fill="none" stroke="#cbd5e1" strokeWidth="14" strokeLinecap="round" />

              <path d="M280 -50 C 180 180 100 280 450 320" fill="none" stroke="white" strokeWidth="16" strokeLinecap="round" />
              <path d="M280 -50 C 180 180 100 280 450 320" fill="none" stroke="#cbd5e1" strokeWidth="12" strokeLinecap="round" />

              {/* Park */}
              <circle cx="80" cy="70" r="45" fill="#dcfce7" opacity="0.8" />
              <text x="62" y="74" fill="#15803d" fontSize="10" fontWeight="bold">PARK</text>

              {/* Lake */}
              <path d="M 300 50 Q 340 20 370 70 T 310 110 Z" fill="#e0f2fe" opacity="0.9" />

              {/* Shops markers placeholders */}
              <circle cx="160" cy="140" r="6" fill="var(--primary)" opacity="0.4" className="pulse-map" />
              <circle cx="160" cy="140" r="3" fill="var(--primary)" />

              <circle cx="210" cy="280" r="6" fill="var(--primary)" opacity="0.4" className="pulse-map" />
              <circle cx="210" cy="280" r="3" fill="var(--primary)" />
            </svg>
          </div>

          {/* Floating center pin */}
          <div style={{
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            transform: success ? 'translateY(-15px)' : 'translateY(0)',
            transition: 'var(--transition-spring)'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '8px 16px',
              borderRadius: '50px',
              boxShadow: 'var(--glass-shadow-large)',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--primary-light)'
            }}>
              <MapPin size={12} color="var(--primary)" />
              <span>{success ? 'Location Verified!' : location?.address || 'Locating You...'}</span>
            </div>
            
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: success ? 'var(--secondary)' : 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '3px solid white',
              animation: loading ? 'pulse-pin 1.2s infinite ease-in-out' : 'none'
            }} className="map-marker-pin">
              {success ? <Check size={20} /> : <Navigation size={18} className="rotate-45-icon" />}
            </div>
            <div style={{
              width: '16px',
              height: '4px',
              backgroundColor: 'rgba(0,0,0,0.15)',
              borderRadius: '50%',
              filter: 'blur(1px)',
              transform: success ? 'scale(0.5)' : 'scale(1)',
              transition: 'var(--transition-smooth)'
            }}></div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTROLS */}
        <div style={{
          flex: '1 1 55%',
          padding: '48px',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }} className="location-inputs-side">
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--dark-slate)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
              Set Your Location
            </h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem' }}>
              We need your coordinates to pair you with high-speed local pickup merchants nearest to you.
            </p>
          </div>

          {/* GPS LOCATOR BUTTON */}
          <button 
            type="button" 
            onClick={() => { requestGPSLocation(); setNewlySelected(true); }} 
            className="btn btn-secondary animate-float"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '16px',
              backgroundColor: 'var(--primary-light)',
              border: '1px dashed var(--primary)',
              color: 'var(--primary)',
              fontSize: '0.95rem',
              fontWeight: 700,
              gap: '10px',
              marginBottom: '28px',
              boxShadow: 'none'
            }}
          >
            <Navigation size={18} />
            {loading ? 'Consulting Satellites...' : 'Detect My GPS Location'}
          </button>

          {/* OR SEPARATOR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--slate-200)' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR ENTER MANUALLY</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--slate-200)' }}></div>
          </div>

          {/* MANUAL FORM SEARCH */}
          <form onSubmit={handleManualSearch} style={{ display: 'flex', gap: '10px', marginBottom: '32px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
              <input 
                id="location-search"
                name="location-search"
                type="text" 
                placeholder="Enter area, city or landmark..." 
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingLeft: '48px', paddingTop: '12px', paddingBottom: '12px' }}
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 20px' }} disabled={loading}>
              <ChevronRight size={20} />
            </button>
          </form>

          {/* PRESETS SLIDER */}
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Popular Active Zones
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {presets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handlePresetSelect(preset.key)}
                  style={{
                    backgroundColor: searchVal === preset.key ? 'var(--primary)' : 'var(--bg-main)',
                    color: searchVal === preset.key ? 'white' : 'var(--dark-slate)',
                    border: '1px solid',
                    borderColor: searchVal === preset.key ? 'var(--primary)' : 'var(--slate-200)',
                    padding: '8px 16px',
                    borderRadius: '50px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <MapPin size={14} />
                  <span>{preset.key}</span>
                </button>
              ))}
            </div>
          </div>

          {/* GEOLOCATION ERROR DISPLAY */}
          {error && (
            <div className="animate-fade-in" style={{
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginTop: '20px',
              textAlign: 'center'
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .location-map-side {
            display: none !important;
          }
          .location-inputs-side {
            flex: 1 1 100% !important;
            padding: 24px !important;
          }
        }
        .rotate-45-icon {
          transform: rotate(45deg);
        }
        @keyframes pulse-pin {
          0% { transform: scale(1); box-shadow: 0 8px 24px rgba(255,107,38,0.2); }
          50% { transform: scale(1.1); box-shadow: 0 8px 24px rgba(255,107,38,0.4); }
          100% { transform: scale(1); box-shadow: 0 8px 24px rgba(255,107,38,0.2); }
        }
        .pulse-map {
          animation: map-pulse 1.8s infinite ease-out;
          transform-origin: center;
        }
        @keyframes map-pulse {
          0% { r: 6px; opacity: 0.5; }
          100% { r: 18px; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
