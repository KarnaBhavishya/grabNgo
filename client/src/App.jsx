// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider, useLocation } from './context/LocationContext';
import { CartProvider, useCart } from './context/CartContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import LocationAccess from './pages/LocationAccess';
import Home from './pages/Home';
import ShopDetail from './pages/ShopDetail';
import Cart from './pages/Cart';
import Tracking from './pages/Tracking';
import MyOrders from './pages/MyOrders';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Icons
import { ShoppingBag, MapPin, User, LogOut, LayoutDashboard, Store, ClipboardList, Menu, X, Home as HomeIcon } from 'lucide-react';

const AppContent = () => {
  const { user, logout, loading } = useAuth();
  const { location, isLocationSet } = useLocation();
  const { cartItems } = useCart();

  // State-based high-fidelity router
  const [currentPage, setCurrentPage] = useState('landing');
  const [pageParams, setPageParams] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const API_BASE = 'http://localhost:5000/api';

  const navigate = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    setMobileMenuOpen(false); // Auto-close drawer on route switch
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Redirect on auth change
  useEffect(() => {
    if (user) {
      if (user.role === 'shopowner') {
        setCurrentPage('owner-dashboard');
      } else if (user.role === 'admin') {
        setCurrentPage('admin-dashboard');
      } else if (!isLocationSet) {
        setCurrentPage('location');
      } else {
        setCurrentPage('home');
      }
    } else {
      // If user logs out
      if (['home', 'shop-detail', 'cart', 'tracking', 'my-orders', 'owner-dashboard', 'admin-dashboard'].includes(currentPage)) {
        setCurrentPage('landing');
      }
    }
  }, [user, isLocationSet]);

  // Global HTTP 401/403 Auth Interceptor
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (response.status === 401 || response.status === 403) {
          // If request was to our secure backend gateway
          if (args[0] && typeof args[0] === 'string' && args[0].startsWith(API_BASE)) {
            console.warn('API returned authorization failure. Logging out session.');
            logout();
          }
        }
        return response;
      } catch (error) {
        throw error;
      }
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [logout]);

  const renderPage = () => {
    // 1. Session check loader
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          gap: '16px'
        }}>
          <div className="spinner" style={{
            width: '50px',
            height: '50px',
            border: '5px solid var(--primary-light)',
            borderTop: '5px solid var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--slate-600)', fontSize: '1.1rem' }}>Securing your session...</h3>
        </div>
      );
    }

    // 2. Client-Side Route Guards (Role/Auth checks)
    const customerPages = ['home', 'shop-detail', 'cart', 'tracking', 'my-orders', 'location'];
    const ownerPages = ['owner-dashboard'];
    const adminPages = ['admin-dashboard'];

    if (!user) {
      if ([...customerPages, ...ownerPages, ...adminPages].includes(currentPage)) {
        return <Landing navigate={navigate} />;
      }
    } else {
      if (user.role === 'customer' && [...ownerPages, ...adminPages].includes(currentPage)) {
        return <Home navigate={navigate} />;
      }
      if (user.role === 'shopowner' && [...customerPages, ...adminPages].includes(currentPage)) {
        return <OwnerDashboard navigate={navigate} />;
      }
      if (user.role === 'admin' && [...customerPages, ...ownerPages].includes(currentPage)) {
        return <AdminDashboard navigate={navigate} />;
      }
    }

    switch (currentPage) {
      case 'landing':
        return <Landing navigate={navigate} />;
      case 'login':
        return <Login navigate={navigate} />;
      case 'register':
        return <Register navigate={navigate} defaultRole={pageParams.defaultRole} />;
      case 'location':
        return <LocationAccess navigate={navigate} />;
      case 'home':
        return <Home navigate={navigate} />;
      case 'shop-detail':
        return <ShopDetail navigate={navigate} shopId={pageParams.shopId} />;
      case 'cart':
        return <Cart navigate={navigate} />;
      case 'tracking':
        return <Tracking navigate={navigate} orderId={pageParams.orderId} />;
      case 'my-orders':
        return <MyOrders navigate={navigate} />;
      case 'owner-dashboard':
        return <OwnerDashboard navigate={navigate} />;
      case 'admin-dashboard':
        return <AdminDashboard navigate={navigate} />;
      default:
        return <Landing navigate={navigate} />;
    }
  };

  return (
    <div className="app-container">
      {/* PROFESSIONAL PREMIUM HEADER */}
      <header className="glass-panel animate-fade-in" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderRadius: '0 0 16px 16px',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
      }}>
        <div className="content-wrapper" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px'
        }}>
          {/* LOGO */}
          <div 
            onClick={() => navigate(user ? (user.role === 'customer' ? 'home' : user.role + '-dashboard') : 'landing')} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '1.4rem',
              color: 'var(--primary)',
              fontFamily: 'var(--font-display)'
            }}
          >
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), hsl(4, 98%, 56%))',
              color: 'white',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.2rem',
              boxShadow: '0 4px 10px rgba(255, 107, 38, 0.3)'
            }}>
              G
            </div>
            <span>Grab<span style={{ color: 'var(--dark-slate)' }}>N</span>Go</span>
          </div>

          {/* ACTIVE LOCATION BAR (DESKTOP) */}
          {user && user.role === 'customer' && isLocationSet && (
            <div 
              onClick={() => navigate('location')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                backgroundColor: 'var(--primary-light)',
                padding: '6px 12px',
                borderRadius: '50px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--primary)',
                maxWidth: '220px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'var(--transition-smooth)'
              }}
              className="location-pill desktop-location"
            >
              <MapPin size={14} />
              <span>{location.address}</span>
            </div>
          )}

          {/* DESKTOP NAVIGATION CONTROLS */}
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!user ? (
              <>
                <button onClick={() => navigate('login')} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Login
                </button>
                <button onClick={() => navigate('register')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Register
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {user.role === 'customer' && (
                  <>
                    <button
                      onClick={() => navigate('my-orders')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--slate-600)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        padding: '4px'
                      }}
                      title="My Orders"
                    >
                      <ClipboardList size={18} />
                      <span style={{ display: 'none' }}>Orders</span>
                    </button>
                    <button 
                      onClick={() => navigate('cart')} 
                      style={{
                        position: 'relative',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--dark-slate)',
                        padding: '4px'
                      }}
                    >
                      <ShoppingBag size={22} />
                      {cartItems.length > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: 'var(--primary)',
                          color: 'white',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid white'
                        }}>
                          {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                        </span>
                      )}
                    </button>
                  </>
                )}

                {/* DASHBOARD SHORTCUTS */}
                {user.role === 'shopowner' && (
                  <button 
                    onClick={() => navigate('owner-dashboard')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  >
                    <Store size={18} />
                    <span>Dashboard</span>
                  </button>
                )}
                {user.role === 'admin' && (
                  <button 
                    onClick={() => navigate('admin-dashboard')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  >
                    <LayoutDashboard size={18} />
                    <span>Admin</span>
                  </button>
                )}

                {/* USER PROFILE & LOGOUT */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem'
                  }}>
                    {user.name.charAt(0)}
                  </div>
                  <button 
                    onClick={logout}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--slate-600)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px'
                    }}
                    title="Log Out"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MOBILE NAVIGATION TOGGLE */}
          <button 
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Toggle Menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      <div 
        className={`mobile-drawer-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* MOBILE SLIDE-OUT DRAWER */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), hsl(4, 98%, 56%))',
              color: 'white',
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1rem'
            }}>
              G
            </div>
            <span>GrabNGo</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dark-slate)' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* ACTIVE LOCATION PILL (MOBILE DRAWER) */}
        {user && user.role === 'customer' && isLocationSet && (
          <div 
            onClick={() => navigate('location')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              backgroundColor: 'var(--primary-light)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--primary)',
              marginBottom: '20px',
              border: '1px solid rgba(255, 107, 38, 0.1)'
            }}
          >
            <MapPin size={16} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {location.address}
            </span>
          </div>
        )}

        {/* DRAWER MENU ITEMS */}
        <div className="mobile-drawer-menu">
          {!user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => navigate('login')} 
                className="btn btn-secondary btn-block"
                style={{ padding: '12px', justifyContent: 'center' }}
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('register')} 
                className="btn btn-primary btn-block"
                style={{ padding: '12px', justifyContent: 'center' }}
              >
                Register
              </button>
            </div>
          ) : (
            <>
              {user.role === 'customer' && (
                <>
                  <div onClick={() => navigate('home')} className="mobile-drawer-item">
                    <HomeIcon size={18} />
                    <span>Browse Stores</span>
                  </div>
                  <div onClick={() => navigate('my-orders')} className="mobile-drawer-item">
                    <ClipboardList size={18} />
                    <span>My Orders</span>
                  </div>
                  <div onClick={() => navigate('cart')} className="mobile-drawer-item" style={{ position: 'relative' }}>
                    <ShoppingBag size={18} />
                    <span>My Cart</span>
                    {cartItems.length > 0 && (
                      <span style={{
                        background: 'var(--primary)',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '50px',
                        marginLeft: 'auto'
                      }}>
                        {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                      </span>
                    )}
                  </div>
                </>
              )}

              {user.role === 'shopowner' && (
                <div onClick={() => navigate('owner-dashboard')} className="mobile-drawer-item">
                  <Store size={18} />
                  <span>Shop Dashboard</span>
                </div>
              )}

              {user.role === 'admin' && (
                <div onClick={() => navigate('admin-dashboard')} className="mobile-drawer-item">
                  <LayoutDashboard size={18} />
                  <span>Admin Panel</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* DRAWER USER CARD & LOGOUT */}
        {user && (
          <div className="mobile-drawer-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem'
              }}>
                {user.name.charAt(0)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 700, color: 'var(--dark-slate)', fontSize: '0.95rem' }}>{user.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-600)', textTransform: 'capitalize' }}>{user.role}</span>
              </div>
            </div>
            <button 
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }} 
              className="btn btn-danger btn-block"
              style={{ padding: '10px' }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        )}
      </div>

      {/* CORE ACTIVE PAGE ROUTE CONTENT CONTAINER */}
      <main className="main-content animate-fade-in">
        {renderPage()}
      </main>

      {/* SUBTLE FOOTER DESIGN */}
      <footer style={{
        backgroundColor: 'var(--dark-slate)',
        color: 'var(--slate-400)',
        padding: '24px 16px',
        textAlign: 'center',
        fontSize: '0.85rem',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div className="content-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 0 }}>
          <p style={{ fontWeight: 600, color: 'white' }}>GrabNGo - Order Local. Pickup Fast.</p>
          <p>© {new Date().getFullYear()} GrabNGo Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

