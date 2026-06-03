// client/src/pages/OwnerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { 
  Store, ShoppingBag, Plus, Trash2, CheckCircle2, 
  XCircle, Clock, ToggleLeft, ToggleRight, DollarSign, 
  Package, TrendingUp, Settings, ChevronRight, Activity,
  Image as ImageIcon, Camera
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function OwnerDashboard({ navigate }) {
  const { token } = useAuth();
  const { location } = useLocation();

  const [shops, setShops] = useState([]);
  const [activeShop, setActiveShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('orders'); // 'orders', 'catalog', 'settings', 'analytics'
  const [error, setError] = useState('');

  // Add Product Form State
  const [prodModal, setProdModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('20');
  const [prodUnit, setProdUnit] = useState('piece');
  const [prodImage, setProdImage] = useState('https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80');

  // Shop Onboarding state (if new owner has no shops)
  const [regName, setRegName] = useState('');
  const [regCatId, setRegCatId] = useState('1');
  const [regDesc, setRegDesc] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('Bengaluru');
  const [regPincode, setRegPincode] = useState('560001');
  const [regOpen, setRegOpen] = useState('09:00:00');
  const [regClose, setRegClose] = useState('21:00:00');
  const [regSubmitMsg, setRegSubmitMsg] = useState('');

  // Shop Settings Edit Form State
  const [shopEditName, setShopEditName] = useState('');
  const [shopEditDesc, setShopEditDesc] = useState('');
  const [shopEditMobile, setShopEditMobile] = useState('');
  const [shopEditAddress, setShopEditAddress] = useState('');
  const [shopEditCity, setShopEditCity] = useState('');
  const [shopEditPincode, setShopEditPincode] = useState('');
  const [shopEditLat, setShopEditLat] = useState('');
  const [shopEditLng, setShopEditLng] = useState('');
  const [shopEditOpen, setShopEditOpen] = useState('');
  const [shopEditClose, setShopEditClose] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Shop Photo State
  const [shopPhotoUrl, setShopPhotoUrl] = useState('');
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState('');

  // Sync state if active shop or tab changes
  useEffect(() => {
    if (activeShop) {
      setShopEditName(activeShop.name || '');
      setShopEditDesc(activeShop.description || '');
      setShopEditMobile(activeShop.mobile || '');
      setShopEditAddress(activeShop.address || '');
      setShopEditCity(activeShop.city || '');
      setShopEditPincode(activeShop.pincode || '');
      setShopEditLat(activeShop.lat || '');
      setShopEditLng(activeShop.lng || '');
      setShopEditOpen(activeShop.open_time || '');
      setShopEditClose(activeShop.close_time || '');
      setShopPhotoUrl(activeShop.shop_photo || '');
      setSettingsSuccess('');
      setPhotoSuccess('');
    }
  }, [activeShop, tab]);

  const fetchDashboardData = async (showShimmer = false) => {
    if (showShimmer) setLoading(true);
    try {
      // 1. Fetch shops owned by this user
      const shopsRes = await fetch(`${API_BASE}/shops/owner`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!shopsRes.ok) throw new Error('Failed to load owned shops.');
      const shopsData = await shopsRes.json();
      setShops(shopsData);

      if (shopsData.length > 0) {
        // Default to first shop
        const currentShop = activeShop || shopsData[0];
        setActiveShop(currentShop);

        // 2. Fetch orders for this shopowner
        const ordersRes = await fetch(`${API_BASE}/orders/owner`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          // Filter orders for the active shop only
          setOrders(ordersData.filter(o => o.shop_id === currentShop.id));
        }

        // 3. Fetch products for this shop
        const productsRes = await fetch(`${API_BASE}/products/shop/${currentShop.id}`);
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error pulling dashboard.');
    } finally {
      if (showShimmer) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
  }, [token]);

  // Sync state if active shop changes
  const handleShopChange = (shop) => {
    setActiveShop(shop);
    setLoading(true);
    setTimeout(() => {
      fetchDashboardData(false);
      setLoading(false);
    }, 400);
  };

  // Register Shop (Onboarding Flow)
  const handleRegisterShop = async (e) => {
    e.preventDefault();
    setError('');
    setRegSubmitMsg('');

    if (!regName || !regMobile || !regAddress || !regPincode) {
      setError('Please fill in essential registration fields.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/shops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: regName,
          category_id: parseInt(regCatId),
          description: regDesc,
          mobile: regMobile,
          address: regAddress,
          city: regCity,
          pincode: regPincode,
          open_time: regOpen,
          close_time: regClose,
          lat: location?.lat || 12.9716,
          lng: location?.lng || 77.5946
        })
      });

      const data = await response.json();
      if (response.ok) {
        setRegSubmitMsg(data.message);
        // Refresh
        setTimeout(() => {
          fetchDashboardData(true);
        }, 1500);
      } else {
        setError(data.message || 'Store registration failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure.');
    }
  };

  // Update Shop Settings Handler
  const handleUpdateShopSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess('');
    setError('');

    try {
      const response = await fetch(`${API_BASE}/shops/${activeShop.id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: shopEditName,
          description: shopEditDesc,
          mobile: shopEditMobile,
          address: shopEditAddress,
          city: shopEditCity,
          pincode: shopEditPincode,
          lat: parseFloat(shopEditLat),
          lng: parseFloat(shopEditLng),
          open_time: shopEditOpen,
          close_time: shopEditClose
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSettingsSuccess('Shop settings modified successfully!');
        // Update local activeShop state
        const updatedShop = {
          ...activeShop,
          name: shopEditName,
          description: shopEditDesc,
          mobile: shopEditMobile,
          address: shopEditAddress,
          city: shopEditCity,
          pincode: shopEditPincode,
          lat: parseFloat(shopEditLat),
          lng: parseFloat(shopEditLng),
          open_time: shopEditOpen,
          close_time: shopEditClose
        };
        setActiveShop(updatedShop);
        setShops(shops.map(s => s.id === activeShop.id ? updatedShop : s));
        fetchDashboardData(false);
      } else {
        setError(data.message || 'Failed to modify shop settings.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure updating settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Update Shop Photo Handler
  const handleUpdatePhoto = async () => {
    if (!shopPhotoUrl.trim()) return;
    setPhotoSaving(true);
    setPhotoSuccess('');
    try {
      const response = await fetch(`${API_BASE}/shops/${activeShop.id}/photo`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shop_photo: shopPhotoUrl })
      });
      const data = await response.json();
      if (response.ok) {
        setPhotoSuccess('Shop photo updated!');
        setActiveShop({ ...activeShop, shop_photo: shopPhotoUrl });
        setShops(shops.map(s => s.id === activeShop.id ? { ...s, shop_photo: shopPhotoUrl } : s));
      } else {
        setError(data.message || 'Failed to update photo.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPhotoSaving(false);
    }
  };

  // Toggle Store Open status
  const handleToggleOpen = async () => {
    const newState = activeShop.is_open ? 0 : 1;
    try {
      const response = await fetch(`${API_BASE}/shops/${activeShop.id}/toggle-open`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_open: newState })
      });
      if (response.ok) {
        setActiveShop({ ...activeShop, is_open: newState });
        setShops(shops.map(s => s.id === activeShop.id ? { ...s, is_open: newState } : s));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Order Status Flow
  const handleUpdateStatus = async (orderId, newStatus) => {
    let prepTime = null;
    if (newStatus === 'accepted') {
      const mins = prompt('Enter preparation time in minutes:', '20');
      if (mins === null) return; // cancel click
      prepTime = parseInt(mins) || 20;
    }

    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          estimated_time: prepTime,
          payment_status: newStatus === 'picked' ? 'paid' : undefined
        })
      });

      if (response.ok) {
        fetchDashboardData(false);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update order status.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting.');
    }
  };

  // Add Product Flow
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!prodName || !prodPrice) {
      alert('Name and price are required.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shop_id: activeShop.id,
          name: prodName,
          description: prodDesc,
          price: parseFloat(prodPrice),
          stock: parseInt(prodStock),
          unit: prodUnit,
          image: prodImage
        })
      });

      if (response.ok) {
        setProdModal(false);
        // reset form
        setProdName('');
        setProdDesc('');
        setProdPrice('');
        setProdStock('20');
        fetchDashboardData(false);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to add product.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Product Flow
  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm('Delete this product permanently from catalog?')) return;
    try {
      const response = await fetch(`${API_BASE}/products/${prodId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchDashboardData(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="content-wrapper flex-center" style={{ minHeight: 'calc(100vh - 180px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="shimmer-bg" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--slate-600)', fontWeight: 600 }}>Loading Dashboard Control Panel...</p>
        </div>
      </div>
    );
  }

  // 1. SHOP ONBOARDING FLOW FOR NEW OWNERS WITH ZERO SHOPS
  if (shops.length === 0) {
    return (
      <div className="content-wrapper flex-center animate-scale-in" style={{ padding: '40px 16px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '40px', backgroundColor: 'white' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🌱</div>
            <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', color: 'var(--dark-slate)' }}>Onboard Your Shop</h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem' }}>Fill in details to register your neighborhood store and start accepting online pickup packaging packet bookings!</p>
          </div>

          {error && (
            <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '20px' }}>
              ⚠️ {error}
            </div>
          )}
          {regSubmitMsg && (
            <div style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '20px', fontWeight: 600 }}>
              🎉 {regSubmitMsg}
            </div>
          )}

          <form onSubmit={handleRegisterShop} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="reg-shop-name">Shop/Store Name</label>
              <input id="reg-shop-name" name="reg-shop-name" type="text" placeholder="Fresh Greens & Groceries" value={regName} onChange={(e) => setRegName(e.target.value)} className="input-field" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="reg-shop-cat">Shop Category</label>
                <select id="reg-shop-cat" name="reg-shop-cat" value={regCatId} onChange={(e) => setRegCatId(e.target.value)} className="input-field" style={{ padding: '12px 16px' }}>
                  <option value="1">Grocery 🛒</option>
                  <option value="2">Bakery 🍞</option>
                  <option value="3">Pharmacy 💊</option>
                  <option value="4">Vegetables 🥦</option>
                  <option value="5">Dairy 🥛</option>
                  <option value="6">Meat 🥩</option>
                  <option value="7">General 🏪</option>
                  <option value="8">Sweets 🍬</option>
                  <option value="9">Stationery 📝</option>
                  <option value="10">Electronics 🔌</option>
                  <option value="11">Pet Store 🐾</option>
                  <option value="12">Fruits 🍎</option>
                  <option value="13">Beverages 🥤</option>
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="reg-shop-mobile">Shop Mobile</label>
                <input id="reg-shop-mobile" name="reg-shop-mobile" type="tel" maxLength={10} placeholder="Mobile number" value={regMobile} onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, ''))} className="input-field" required />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="reg-shop-desc">Shop Description</label>
              <input id="reg-shop-desc" name="reg-shop-desc" type="text" placeholder="Short explanation of what your store sells..." value={regDesc} onChange={(e) => setRegDesc(e.target.value)} className="input-field" />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="reg-shop-addr">Address</label>
              <input id="reg-shop-addr" name="reg-shop-addr" type="text" placeholder="Street, landmark area..." value={regAddress} onChange={(e) => setRegAddress(e.target.value)} className="input-field" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="reg-shop-pin">Pincode</label>
                <input id="reg-shop-pin" name="reg-shop-pin" type="text" maxLength={6} placeholder="560001" value={regPincode} onChange={(e) => setRegPincode(e.target.value.replace(/\D/g, ''))} className="input-field" required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="reg-shop-open">Operating Hours</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input id="reg-shop-open" name="reg-shop-open" type="text" placeholder="09:00:00" value={regOpen} onChange={(e) => setRegOpen(e.target.value)} className="input-field" style={{ width: '90px', padding: '10px' }} />
                  <span>to</span>
                  <input id="reg-shop-close" name="reg-shop-close" type="text" placeholder="21:00:00" value={regClose} onChange={(e) => setRegClose(e.target.value)} className="input-field" style={{ width: '90px', padding: '10px' }} />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
              Submit Shop Registration
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. MAIN ACTIVE OWNER DASHBOARD INTERFACE
  const pendingOrders = orders.filter(o => o.order_status === 'placed');
  const activeOrders = orders.filter(o => ['accepted', 'packing', 'ready'].includes(o.order_status));
  const completedOrders = orders.filter(o => o.order_status === 'picked');

  // Sum total revenue
  const totalRevenue = completedOrders.reduce((acc, o) => acc + parseFloat(o.subtotal || 0), 0);

  return (
    <div className="content-wrapper animate-fade-in colorful-mesh-owner" style={{ padding: '24px 20px', borderRadius: 'var(--radius-xl)', minHeight: 'calc(100vh - 120px)', marginTop: '20px', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.05)' }}>
      
      {/* HEADER SECTION WITH MULTI-SHOP SELECTOR & STATUS TOGGLE */}
      <section style={{
        background: 'linear-gradient(135deg, hsl(200, 100%, 94%) 0%, hsl(280, 100%, 94%) 100%)',
        padding: '32px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--primary-light)',
        marginBottom: '32px',
        display: 'flex',
        flexWrap: 'wrap-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px',
        boxShadow: 'var(--glass-shadow-large)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow accent */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 1, flex: '1 1 500px' }}>
          <div style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(255, 107, 38, 0.4)'
          }}>
            <Store size={28} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', color: 'var(--dark-slate)' }}>{activeShop.name}</h2>
              {shops.length > 1 && (
                <select 
                  onChange={(e) => handleShopChange(shops.find(s => s.id === parseInt(e.target.value)))}
                  value={activeShop.id}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: '50px',
                    borderColor: 'var(--slate-200)',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
            
            {/* Approval Status Badge */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
              {activeShop.is_approved ? (
                <span className="badge badge-open" style={{ fontSize: '0.7rem', padding: '3px 10px', fontWeight: 700 }}>✓ Approved by Admin</span>
              ) : (
                <span className="badge badge-status" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)', fontSize: '0.7rem', padding: '3px 10px', fontWeight: 800 }}>⏳ Pending Admin Approval</span>
              )}
              <span style={{ color: 'var(--slate-400)' }}>•</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--slate-600)', fontWeight: 600 }}>Category: {activeShop.category_name || 'Grocery'}</span>
            </div>
          </div>
        </div>

        {/* ONLINE STORE TOGGLER & HERO IMAGE SIDE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', zIndex: 1 }}>
          {activeShop.is_approved === 1 && (
            <div 
              onClick={handleToggleOpen}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                backgroundColor: activeShop.is_open ? 'var(--secondary)' : 'var(--slate-600)',
                padding: '10px 20px',
                borderRadius: '50px',
                color: 'white',
                boxShadow: activeShop.is_open ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none',
                transition: 'var(--transition-smooth)'
              }}
            >
              {activeShop.is_open ? (
                <>
                  <ToggleRight size={26} color="white" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Accepting Orders</span>
                </>
              ) : (
                <>
                  <ToggleLeft size={26} color="white" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Store Closed</span>
                </>
              )}
            </div>
          )}

          {/* Mini Owner Banner Frame */}
          <div style={{
            width: '120px',
            height: '80px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: 'var(--glass-shadow)',
            border: '2px solid white',
            display: 'none'
          }} className="desktop-location">
            <img src="/owner_hero.png" alt="Merchant illustration" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </section>

      {/* DASHBOARD TAB CONTROLLERS */}
      <section style={{ display: 'flex', borderBottom: '2px solid var(--slate-200)', gap: '24px', marginBottom: '24px', overflowX: 'auto' }}>
        {[
          { key: 'orders', label: 'Orders Desk', icon: <ShoppingBag size={18} /> },
          { key: 'catalog', label: 'Catalogue CRUD', icon: <Package size={18} /> },
          { key: 'settings', label: 'Shop Settings', icon: <Settings size={18} /> },
          { key: 'analytics', label: 'Live Metrics', icon: <Activity size={18} /> }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            style={{
              padding: '12px 6px',
              border: 'none',
              background: 'none',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: tab === item.key ? 'var(--primary)' : 'var(--slate-400)',
              borderBottom: tab === item.key ? '3px solid var(--primary)' : '3px solid transparent',
              transition: 'var(--transition-smooth)',
              whiteSpace: 'nowrap'
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </section>

      {/* ======================= TAB CONTENT AREA ======================= */}

      {/* TAB 1: ORDERS CONTROL DESK */}
      {tab === 'orders' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* A. NEW INCOMING PLACED ORDERS */}
          <div>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', marginBottom: '16px', color: 'var(--primary)' }}>
              🔔 Incoming Bookings ({pendingOrders.length})
            </h3>
            
            {pendingOrders.length === 0 ? (
              <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--slate-600)', border: '1px dashed var(--slate-200)' }}>
                No new incoming order tickets currently.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pendingOrders.map((order) => (
                  <div key={order.id} className="glass-panel" style={{ padding: '24px', backgroundColor: 'white', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>{order.order_number}</span>
                        {order.delivery_mode === 'delivery' ? (
                          <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.65rem', fontWeight: 800 }}>
                            🛵 HOME DELIVERY
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--slate-600)', fontSize: '0.65rem', fontWeight: 800 }}>
                            🚶 SELF PICKUP
                          </span>
                        )}
                      </div>
                      <strong style={{ fontSize: '1.1rem' }}>Client: {order.customer_name}</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>📱 Mob: {order.customer_mobile}</span>
                      
                      {order.delivery_mode === 'delivery' && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginTop: '8px', borderLeft: '3px solid var(--primary)', paddingLeft: '8px', lineHeight: 1.3 }}>
                          <strong>📍 Deliver To:</strong> {order.delivery_address_text}
                        </div>
                      )}
                      
                      {order.manual_list && (
                        <div style={{ backgroundColor: 'var(--bg-main)', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--slate-600)', marginTop: '8px', border: '1px solid var(--slate-200)' }}>
                          <strong>📝 Custom Grocery List:</strong>
                          <div style={{ whiteSpace: 'pre-wrap', marginTop: '4px', fontFamily: 'monospace' }}>{order.manual_list}</div>
                        </div>
                      )}

                      {order.items && order.items.length > 0 && !order.manual_list && (
                        <div style={{ 
                          backgroundColor: 'var(--bg-main)', 
                          padding: '12px 16px', 
                          borderRadius: 'var(--radius-md)', 
                          fontSize: '0.85rem', 
                          color: 'var(--slate-600)', 
                          marginTop: '8px', 
                          border: '1px solid var(--slate-200)',
                          width: '100%',
                          minWidth: '280px'
                        }}>
                          <strong style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--slate-400)', marginBottom: '6px', textTransform: 'uppercase' }}>
                            📦 ITEMS TO PACKAGE:
                          </strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {order.items.map(item => (
                              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--dark-slate)', fontWeight: 500 }}>
                                <span>{item.item_name}</span>
                                <strong style={{ color: 'var(--slate-600)' }}>x{item.quantity}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleUpdateStatus(order.id, 'accepted')} className="btn btn-primary" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
                        Accept & Package
                      </button>
                      <button onClick={() => handleUpdateStatus(order.id, 'cancelled')} className="btn btn-danger" style={{ padding: '10px 16px', fontSize: '0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'red' }}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* B. ACTIVE WORKSPACE ORDERS (Accepted, Packing, Ready) */}
          <div>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
              🛠️ Active Packaging queue ({activeOrders.length})
            </h3>

            {activeOrders.length === 0 ? (
              <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--slate-600)' }}>
                No active orders in packing pipelines.
              </div>
            ) : (
              <div className="grid-responsive">
                {activeOrders.map((order) => (
                  <div key={order.id} className="glass-panel" style={{ padding: '20px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="flex-between">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>{order.order_number}</span>
                        {order.delivery_mode === 'delivery' ? (
                          <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.6rem', fontWeight: 800 }}>
                            🛵 DELIVERY
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--slate-600)', fontSize: '0.6rem', fontWeight: 800 }}>
                            🚶 PICKUP
                          </span>
                        )}
                      </div>
                      <span className="badge badge-open" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                        {order.order_status}
                      </span>
                    </div>

                    <div>
                      <strong style={{ fontSize: '1rem', color: 'var(--dark-slate)' }}>{order.customer_name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginTop: '2px' }}>Estimated: {order.estimated_time || 20} mins prep</div>
                      
                      {order.delivery_mode === 'delivery' && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)', marginTop: '8px', borderLeft: '3px solid var(--primary)', paddingLeft: '6px', lineHeight: 1.3 }}>
                          <strong>📍 Deliver To:</strong> {order.delivery_address_text}
                        </div>
                      )}
                    </div>

                    {/* Checklist details */}
                    <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--slate-400)' }}>PACKAGING CHECKLIST:</span>
                      {order.items && order.items.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                          <input type="checkbox" style={{ cursor: 'pointer' }} />
                          <span>{item.item_name} <strong style={{ color: 'var(--dark-slate)' }}>x{item.quantity}</strong></span>
                        </div>
                      ))}
                    </div>

                    {/* Step advancing actions */}
                    <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                      {order.order_status === 'accepted' && (
                        <button onClick={() => handleUpdateStatus(order.id, 'packing')} className="btn btn-primary btn-block" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                          Start Packing Fresh
                        </button>
                      )}
                      {order.order_status === 'packing' && (
                        <button 
                          onClick={() => handleUpdateStatus(order.id, 'ready')} 
                          className="btn btn-primary btn-block" 
                          style={{ padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'var(--secondary)' }}
                        >
                          {order.delivery_mode === 'delivery' ? 'Hand to Delivery Partner 🛵' : 'Mark as Ready to Pickup ⚡'}
                        </button>
                      )}
                      {order.order_status === 'ready' && (
                        <button 
                          onClick={() => handleUpdateStatus(order.id, 'picked')} 
                          className="btn btn-primary btn-block" 
                          style={{ padding: '8px 12px', fontSize: '0.8rem', backgroundColor: 'var(--secondary)' }}
                        >
                          {order.delivery_mode === 'delivery' ? 'Mark as Delivered 🎉' : 'Verify QR / Picked Up ✓'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* C. DELIVERED ORDERS HISTORY */}
          <div>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', marginBottom: '16px', color: 'hsl(152, 76%, 30%)' }}>
              ✅ Delivered Orders ({completedOrders.length})
            </h3>

            {completedOrders.length === 0 ? (
              <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--slate-600)', border: '1px dashed var(--slate-200)' }}>
                No delivered orders yet. Complete orders will appear here.
              </div>
            ) : (
              <div className="glass-panel" style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: 'var(--radius-lg)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--slate-200)', color: 'var(--slate-600)', fontWeight: 700 }}>
                      <th style={{ padding: '14px' }}>Order No.</th>
                      <th style={{ padding: '14px' }}>Customer</th>
                      <th style={{ padding: '14px' }}>Amount</th>
                      <th style={{ padding: '14px' }}>Payment</th>
                      <th style={{ padding: '14px' }}>Date</th>
                      <th style={{ padding: '14px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedOrders.map((order) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--slate-200)' }}>
                        <td style={{ padding: '14px', fontWeight: 700, color: 'var(--primary)' }}>{order.order_number}</td>
                        <td style={{ padding: '14px', color: 'var(--dark-slate)', fontWeight: 600 }}>
                           {order.customer_name}
                           <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 400 }}>
                             {order.delivery_mode === 'delivery' ? '🛵 Home Delivery' : '🚶 Self Pickup'}
                           </div>
                         </td>
                        <td style={{ padding: '14px', fontWeight: 700, color: 'var(--dark-slate)' }}>₹{parseFloat(order.total_amount || order.subtotal || 0).toFixed(2)}</td>
                        <td style={{ padding: '14px', textTransform: 'capitalize', color: 'var(--slate-600)' }}>
                          {order.payment_mode} 
                          <span className="badge" style={{ marginLeft: '6px', backgroundColor: 'hsl(152, 76%, 94%)', color: 'hsl(152, 76%, 30%)', fontSize: '0.6rem', fontWeight: 700 }}>
                            {order.payment_status || 'paid'}
                          </span>
                        </td>
                        <td style={{ padding: '14px', color: 'var(--slate-400)', fontSize: '0.8rem' }}>
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <span className="badge" style={{ backgroundColor: 'hsl(152, 76%, 94%)', color: 'hsl(152, 76%, 30%)', fontSize: '0.65rem', fontWeight: 700 }}>
                            ✓ Delivered
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CATALOG MANAGER */}
      {tab === 'catalog' && (
        <div className="animate-fade-in">
          <div className="flex-between" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>Products Catalog Inventory</h3>
            <button onClick={() => setProdModal(true)} className="btn btn-primary" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
              <Plus size={16} /> Add Product
            </button>
          </div>

          {products.length === 0 ? (
            <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--slate-600)', border: '1px dashed var(--slate-200)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📦</div>
              <p>Your catalogue is empty. Add products to start receiving orders!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {products.map((product) => (
                <div 
                  key={product.id}
                  className="glass-panel"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <img 
                    src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&q=80'} 
                    alt={product.name} 
                    style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }}
                  />
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--dark-slate)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</h4>
                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>
                      ₹{parseFloat(product.price).toFixed(2)} <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>/ {product.unit}</span>
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)' }}>Stock: {product.stock} units</div>
                  </div>

                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)', flexShrink: 0 }}
                  >
                    <Trash2 size={18} color="red" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SHOP SETTINGS */}
      {tab === 'settings' && activeShop && (
        <div className="animate-fade-in" style={{ maxWidth: '650px', margin: '0 auto' }}>
          
          {/* SHOP PHOTO SECTION */}
          <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'white', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={18} color="var(--primary)" /> Shop Photo
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
              {/* Current photo preview */}
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '2px solid var(--slate-200)',
                flexShrink: 0
              }}>
                <img
                  src={shopPhotoUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80'}
                  alt="Shop"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Photo URL</label>
                  <input
                    type="text"
                    placeholder="Paste image URL (e.g., Unsplash link)"
                    value={shopPhotoUrl}
                    onChange={(e) => setShopPhotoUrl(e.target.value)}
                    className="input-field"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                {/* Photo preset selector */}
                <select
                  onChange={(e) => setShopPhotoUrl(e.target.value)}
                  className="input-field"
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                  defaultValue=""
                >
                  <option value="" disabled>Quick Pick a Preset Photo...</option>
                  <option value="https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80">Grocery Store</option>
                  <option value="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80">Bakery</option>
                  <option value="https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=500&q=80">Pharmacy</option>
                  <option value="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=500&q=80">Vegetables Market</option>
                  <option value="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=500&q=80">Sweets Shop</option>
                  <option value="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&q=80">General Store</option>
                </select>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={handleUpdatePhoto}
                    disabled={photoSaving}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                  >
                    {photoSaving ? 'Saving...' : 'Update Photo'}
                  </button>
                  {photoSuccess && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 600 }}>✓ {photoSuccess}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SHOP SETTINGS FORM */}
          <div className="glass-panel" style={{ padding: '32px', backgroundColor: 'white' }}>
            <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'var(--dark-slate)' }}>
              🏪 Store Configuration Settings
            </h3>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Modify your local pickup store's metadata details, operational schedule, and geocoding coordinates.
            </p>

            {settingsSuccess && (
              <div className="animate-fade-in" style={{
                backgroundColor: 'var(--secondary-light)',
                color: 'var(--secondary)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '20px',
                borderLeft: '4px solid var(--secondary)'
              }}>
                ✓ {settingsSuccess}
              </div>
            )}

            {error && (
              <div className="animate-fade-in" style={{
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '20px',
                borderLeft: '4px solid var(--danger)'
              }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleUpdateShopSettings} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="settings-shop-name">Store Name</label>
                <input id="settings-shop-name" name="settings-shop-name" type="text" value={shopEditName} onChange={(e) => setShopEditName(e.target.value)} className="input-field" required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="settings-shop-desc">Store Description</label>
                <textarea id="settings-shop-desc" name="settings-shop-desc" value={shopEditDesc} onChange={(e) => setShopEditDesc(e.target.value)} className="input-field" style={{ minHeight: '80px', padding: '12px', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="settings-shop-mobile">Support Mobile Number</label>
                  <input id="settings-shop-mobile" name="settings-shop-mobile" type="tel" maxLength={10} value={shopEditMobile} onChange={(e) => setShopEditMobile(e.target.value.replace(/\D/g, ''))} className="input-field" required />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Category (Assigned)</label>
                  <input type="text" value={activeShop.category_id === 1 ? 'Grocery' : activeShop.category_id === 2 ? 'Bakery' : activeShop.category_id === 3 ? 'Pharmacy' : activeShop.category_id === 4 ? 'Vegetables' : activeShop.category_id === 8 ? 'Sweets' : activeShop.category_id === 9 ? 'Stationery' : activeShop.category_id === 10 ? 'Electronics' : activeShop.category_id === 11 ? 'Pet Store' : activeShop.category_id === 12 ? 'Fruits' : activeShop.category_id === 13 ? 'Beverages' : 'General'} className="input-field" disabled style={{ backgroundColor: 'var(--bg-main)', cursor: 'not-allowed' }} />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="settings-shop-address">Street Address</label>
                <input id="settings-shop-address" name="settings-shop-address" type="text" value={shopEditAddress} onChange={(e) => setShopEditAddress(e.target.value)} className="input-field" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="settings-shop-city">City</label>
                  <input id="settings-shop-city" name="settings-shop-city" type="text" value={shopEditCity} onChange={(e) => setShopEditCity(e.target.value)} className="input-field" required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="settings-shop-pincode">Pincode</label>
                  <input id="settings-shop-pincode" name="settings-shop-pincode" type="text" maxLength={6} value={shopEditPincode} onChange={(e) => setShopEditPincode(e.target.value.replace(/\D/g, ''))} className="input-field" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="settings-shop-lat">Latitude</label>
                  <input id="settings-shop-lat" name="settings-shop-lat" type="number" step="0.000001" value={shopEditLat} onChange={(e) => setShopEditLat(e.target.value)} className="input-field" required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="settings-shop-lng">Longitude</label>
                  <input id="settings-shop-lng" name="settings-shop-lng" type="number" step="0.000001" value={shopEditLng} onChange={(e) => setShopEditLng(e.target.value)} className="input-field" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="settings-shop-open">Daily Open Time</label>
                  <input id="settings-shop-open" name="settings-shop-open" type="text" placeholder="09:00:00" value={shopEditOpen} onChange={(e) => setShopEditOpen(e.target.value)} className="input-field" required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="settings-shop-close">Daily Close Time</label>
                  <input id="settings-shop-close" name="settings-shop-close" type="text" placeholder="21:00:00" value={shopEditClose} onChange={(e) => setShopEditClose(e.target.value)} className="input-field" required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={settingsLoading} style={{ padding: '14px', marginTop: '10px' }}>
                {settingsLoading ? 'Saving Configurations...' : 'Save Configured Settings'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: METRICS & ANALYTICS */}
      {tab === 'analytics' && (
        <div className="animate-fade-in">
          {/* Key KPIs rows */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            
            {/* KPI 1 */}
            <div className="glass-panel card-3d" style={{ padding: '24px', background: 'linear-gradient(135deg, hsl(152, 76%, 90%), white)', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}>
                <DollarSign size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'hsl(152, 76%, 20%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue (Gross)</span>
                <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark-slate)', marginTop: '2px' }}>₹{totalRevenue.toFixed(2)}</h4>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="glass-panel card-3d" style={{ padding: '24px', background: 'linear-gradient(135deg, hsl(14, 100%, 90%), white)', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(255, 107, 38, 0.2)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(255, 107, 38, 0.2)' }}>
                <ShoppingBag size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'hsl(14, 100%, 25%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pickups</span>
                <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark-slate)', marginTop: '2px' }}>{completedOrders.length} orders</h4>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="glass-panel card-3d" style={{ padding: '24px', background: 'linear-gradient(135deg, hsl(40, 96%, 90%), white)', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--warning)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.2)' }}>
                <Package size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'hsl(40, 95%, 20%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Stock Items</span>
                <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark-slate)', marginTop: '2px' }}>{products.length} cataloged</h4>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="glass-panel card-3d" style={{ padding: '24px', background: 'linear-gradient(135deg, hsl(200, 76%, 90%), white)', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'hsl(200, 76%, 45%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(14, 165, 233, 0.2)' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'hsl(200, 76%, 20%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Orders</span>
                <h4 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark-slate)', marginTop: '2px' }}>{orders.length} received</h4>
              </div>
            </div>
          </div>

          {/* Recent Delivered Orders quick view */}
          {completedOrders.length > 0 && (
            <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'white' }}>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', marginBottom: '16px' }}>📊 Recent Completed Orders</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {completedOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--slate-100)', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', marginRight: '8px' }}>{order.order_number}</span>
                      <span style={{ color: 'var(--slate-600)' }}>{order.customer_name}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--dark-slate)' }}>₹{parseFloat(order.total_amount || order.subtotal || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PRODUCT CREATION CRUD MODAL FORM */}
      {prodModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel animate-scale-in" style={{
            backgroundColor: 'white',
            padding: '32px',
            width: '90%',
            maxWidth: '500px',
            borderRadius: 'var(--radius-xl)'
          }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>Add New Store Product</h3>
              <button onClick={() => setProdModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--slate-600)' }}>&times;</button>
            </div>

            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="prod-name">Product Name</label>
                <input id="prod-name" name="prod-name" type="text" placeholder="Fresh Red Apples" value={prodName} onChange={(e) => setProdName(e.target.value)} className="input-field" style={{ width: '100%' }} required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="prod-desc">Description</label>
                <input id="prod-desc" name="prod-desc" type="text" placeholder="Organic sweet apples imported from local farms" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} className="input-field" style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="prod-price">Price (₹)</label>
                  <input id="prod-price" name="prod-price" type="number" step="0.01" placeholder="120.00" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} className="input-field" style={{ width: '100%' }} required />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="prod-stock">Initial Stock</label>
                  <input id="prod-stock" name="prod-stock" type="number" placeholder="50" value={prodStock} onChange={(e) => setProdStock(e.target.value)} className="input-field" style={{ width: '100%' }} />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="prod-unit">Measuring Unit</label>
                  <input id="prod-unit" name="prod-unit" type="text" placeholder="kg" value={prodUnit} onChange={(e) => setProdUnit(e.target.value)} className="input-field" style={{ width: '100%' }} />
                </div>
              </div>

              {/* IMAGE PRESETS OPTIONS SELECTOR */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="prod-img">Preset Product Image</label>
                <select id="prod-img" name="prod-img" value={prodImage} onChange={(e) => setProdImage(e.target.value)} className="input-field" style={{ padding: '10px 16px', width: '100%' }}>
                  <option value="https://images.unsplash.com/photo-1614749514827-7f55b91a1fb3?w=300&q=80">Coconut Oil 🧴</option>
                  <option value="https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&q=80">Bananas 🍌</option>
                  <option value="https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=300&q=80">Eggs Box 🥚</option>
                  <option value="https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=300&q=80">Breads 🍞</option>
                  <option value="https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80">Rice Pack 🌾</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '12px' }}>
                Add to Inventory Catalog
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
