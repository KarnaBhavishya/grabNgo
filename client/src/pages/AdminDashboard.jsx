// client/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, Users, Store, ShoppingBag, 
  DollarSign, Check, X, Trash2, Plus, 
  Layers, BarChart, ShieldCheck, Grid 
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function AdminDashboard({ navigate }) {
  const { token, user: loggedInUser } = useAuth();

  const [stats, setStats] = useState(null);
  const [pendingShops, setPendingShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('overview'); // 'overview', 'approvals', 'users', 'categories'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  // Categories Form State
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('📦');

  // Edit User State
  const [editModal, setEditModal] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editRole, setEditRole] = useState('customer');
  const [editActive, setEditActive] = useState(1);

  // All Shops State
  const [allShops, setAllShops] = useState([]);

  // Shop Edit State
  const [shopEditModal, setShopEditModal] = useState(false);
  const [shopEditId, setShopEditId] = useState(null);
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
  const [shopEditApproved, setShopEditApproved] = useState(1);
  const [shopEditActive, setShopEditActive] = useState(1);

  const fetchAdminData = async (showShimmer = false) => {
    if (showShimmer) setLoading(true);
    try {
      // 1. Fetch Aggregated Stats
      const statsRes = await fetch(`${API_BASE}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch Pending Approvals
      const pendingRes = await fetch(`${API_BASE}/admin/pending-shops`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingShops(pendingData);
      }

      // 3. Fetch Platform Users List
      const usersRes = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      // 4. Fetch All Shops with owner details
      const shopsRes = await fetch(`${API_BASE}/admin/shops`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (shopsRes.ok) {
        const shopsData = await shopsRes.json();
        setAllShops(shopsData);
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure loading Admin stats.');
    } finally {
      if (showShimmer) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData(true);
  }, [token]);

  // Shop Approvals/Rejection Handler
  const handleShopApproval = async (shopId, approveState) => {
    try {
      const response = await fetch(`${API_BASE}/admin/shops/${shopId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approve: approveState })
      });

      if (response.ok) {
        fetchAdminData(false);
      } else {
        const data = await response.json();
        alert(data.message || 'Approval action failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // User Edit Handlers
  const handleStartEditUser = (userToEdit) => {
    setEditUserId(userToEdit.id);
    setEditName(userToEdit.name);
    setEditEmail(userToEdit.email);
    setEditMobile(userToEdit.mobile);
    setEditRole(userToEdit.role);
    setEditActive(userToEdit.is_active !== undefined ? userToEdit.is_active : 1);
    setEditModal(true);
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/admin/users/${editUserId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          mobile: editMobile,
          role: editRole,
          is_active: editActive
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'User details modified successfully!');
        setEditModal(false);
        fetchAdminData(false);
      } else {
        alert(data.message || 'Modification failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating user.');
    }
  };

  // User Deletion Handler
  const handleDeleteUser = async (userId) => {
    if (parseInt(userId) === loggedInUser?.id) {
      alert('Security lock: You cannot delete your active Administrator session account.');
      return;
    }

    if (!window.confirm('Delete this user account permanently from the platform?')) return;

    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchAdminData(false);
      } else {
        const data = await response.json();
        alert(data.message || 'Deletion failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Category Creation Handler
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName) return;

    try {
      const response = await fetch(`${API_BASE}/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: catName, icon: catIcon })
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Category added successfully!');
        setCatName('');
        setCatIcon('📦');
        fetchAdminData(false);
      } else {
        alert(data.message || 'Creation failed.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Shop Edit Handlers
  const handleStartEditShop = (shop) => {
    setShopEditId(shop.id);
    setShopEditName(shop.name);
    setShopEditDesc(shop.description || '');
    setShopEditMobile(shop.mobile);
    setShopEditAddress(shop.address);
    setShopEditCity(shop.city);
    setShopEditPincode(shop.pincode);
    setShopEditLat(shop.lat || '');
    setShopEditLng(shop.lng || '');
    setShopEditOpen(shop.open_time);
    setShopEditClose(shop.close_time);
    setShopEditApproved(shop.is_approved !== undefined ? shop.is_approved : 1);
    setShopEditActive(shop.is_active !== undefined ? shop.is_active : 1);
    setShopEditModal(true);
  };

  const handleSaveShopEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/admin/shops/${shopEditId}`, {
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
          close_time: shopEditClose,
          is_approved: shopEditApproved,
          is_active: shopEditActive
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Shop updated successfully!');
        setShopEditModal(false);
        fetchAdminData(false);
      } else {
        alert(data.message || 'Failed to update shop.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating shop.');
    }
  };

  if (loading) {
    return (
      <div className="content-wrapper flex-center" style={{ minHeight: 'calc(100vh - 180px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="shimmer-bg" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--slate-600)', fontWeight: 600 }}>Loading Administrator Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper animate-fade-in colorful-mesh-admin" style={{ padding: '24px 20px', borderRadius: 'var(--radius-xl)', minHeight: 'calc(100vh - 120px)', marginTop: '20px', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', color: '#f1f5f9' }}>
      
      {/* HEADER META ROW */}
      <section style={{
        background: 'linear-gradient(135deg, hsl(222, 47%, 16%) 0%, hsl(280, 50%, 20%) 100%)',
        color: 'white',
        padding: '32px',
        borderRadius: 'var(--radius-xl)',
        marginBottom: '32px',
        display: 'flex',
        flexWrap: 'wrap-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px',
        border: '1px solid rgba(255, 107, 38, 0.15)',
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
          background: 'radial-gradient(circle, rgba(255, 107, 38, 0.15) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 1, flex: '1 1 500px' }}>
          <div style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(255, 107, 38, 0.4)'
          }}>
            <ShieldAlert size={28} />
          </div>
          <div>
            <span className="badge" style={{
              backgroundColor: 'rgba(255, 107, 38, 0.2)',
              color: 'var(--primary)',
              fontWeight: 800,
              fontSize: '0.7rem',
              marginBottom: '8px'
            }}>
              ⚙️ PLATFORM CONTROLLER
            </span>
            <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', color: 'white', lineHeight: 1.2 }}>System Administration Core</h2>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', marginTop: '4px' }}>
              Aggregating platform shops approvals, metrics, categories, and account states.
            </p>
          </div>
        </div>

        {/* Hero Image Block */}
        <div style={{
          width: '140px',
          height: '90px',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          border: '2px solid rgba(255,255,255,0.1)',
          zIndex: 1
        }} className="desktop-location">
          <img src="/admin_hero.png" alt="Admin illustration" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </section>

      {/* ADMIN DESK NAVIGATION TABS */}
      <section style={{ display: 'flex', borderBottom: '2px solid var(--slate-200)', gap: '24px', marginBottom: '24px' }}>
        {[
          { key: 'overview', label: 'Overview Metrics', icon: <BarChart size={18} /> },
          { key: 'approvals', label: 'Store Approvals', icon: <Store size={18} /> },
          { key: 'shops', label: 'Shops Management', icon: <ShieldCheck size={18} /> },
          { key: 'users', label: 'Platform Users', icon: <Users size={18} /> },
          { key: 'categories', label: 'Global Categories', icon: <Layers size={18} /> }
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
              transition: 'var(--transition-smooth)'
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </section>

      {/* ======================= TAB CONTENTS ======================= */}

      {/* TAB 1: PLATFORM STATS DESK */}
      {tab === 'overview' && stats && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* KPI Analytics counters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            
            {/* Sales sum */}
            <div className="glass-panel card-3d" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyStyle: 'center', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}>
                <DollarSign size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross Revenue sum</span>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginTop: '2px' }}>₹{parseFloat(stats.totalSales || 0).toFixed(2)}</h4>
              </div>
            </div>

            {/* Total orders */}
            <div className="glass-panel card-3d" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(255, 107, 38, 0.3)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyStyle: 'center', boxShadow: '0 4px 10px rgba(255, 107, 38, 0.3)' }}>
                <ShoppingBag size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order volume</span>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginTop: '2px' }}>{stats.totalOrders} tickets</h4>
              </div>
            </div>

            {/* Platform users */}
            <div className="glass-panel card-3d" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'hsl(200, 76%, 45%)', color: 'white', display: 'flex', alignItems: 'center', justifyStyle: 'center', boxShadow: '0 4px 10px rgba(14, 165, 233, 0.3)' }}>
                <Users size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Users</span>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginTop: '2px' }}>{stats.totalUsers} registered</h4>
              </div>
            </div>

            {/* Pending Approvals counter */}
            <div className="glass-panel card-3d" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--warning)', color: 'white', display: 'flex', alignItems: 'center', justifyStyle: 'center', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)' }}>
                <Store size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Store Approvals</span>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginTop: '2px' }}>{stats.pendingShops} pending</h4>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STORE APPROVALS PORTAL */}
      {tab === 'approvals' && (
        <div className="animate-fade-in">
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
            🏪 Pending Merchant Registrations ({pendingShops.length})
          </h3>

          {pendingShops.length === 0 ? (
            <div style={{ padding: '32px', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--slate-600)', border: '1px dashed var(--slate-200)' }}>
              No merchants currently waiting in approval queues.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingShops.map((shop) => (
                <div 
                  key={shop.id} 
                  className="glass-panel" 
                  style={{
                    padding: '24px',
                    backgroundColor: 'white',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '24px'
                  }}
                >
                  {/* Shop Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '300px' }}>
                    <span className="badge badge-open" style={{ alignSelf: 'flex-start', fontSize: '0.65rem' }}>{shop.category_name}</span>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--dark-slate)', marginTop: '4px' }}>{shop.name}</strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>{shop.description}</p>
                    
                    <div style={{ borderTop: '1px solid var(--slate-100)', marginTop: '8px', paddingTop: '8px', fontSize: '0.8rem', color: 'var(--slate-400)', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                      <span>📍 Address: {shop.address}, {shop.city} - {shop.pincode}</span>
                      <span>Owner: <strong>{shop.owner_name}</strong> ({shop.owner_email})</span>
                    </div>
                  </div>

                  {/* Approve / Reject buttons */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => handleShopApproval(shop.id, true)} 
                      className="btn btn-primary"
                      style={{ padding: '10px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Check size={16} /> Approve Store
                    </button>
                    <button 
                      onClick={() => handleShopApproval(shop.id, false)} 
                      className="btn btn-danger"
                      style={{ padding: '10px 16px', fontSize: '0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'red', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <X size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PLATFORM USERS REGISTRY */}
      {tab === 'users' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', margin: 0 }}>
              👥 Registered Accounts Registry ({
                users.filter(item => {
                  if (userFilter !== 'all' && item.role !== userFilter) return false;
                  if (userSearch.trim()) {
                    const term = userSearch.toLowerCase();
                    return item.name.toLowerCase().includes(term) || item.email.toLowerCase().includes(term) || item.mobile.includes(term);
                  }
                  return true;
                }).length
              })
            </h3>
            
            {/* Search Input */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="input-field"
                style={{ padding: '8px 16px', fontSize: '0.85rem', width: '220px', margin: 0 }}
              />
            </div>
          </div>

          {/* Role Filter Pills */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { key: 'all', label: 'All Users' },
              { key: 'customer', label: 'Customers' },
              { key: 'shopowner', label: 'Shop Owners' },
              { key: 'admin', label: 'Admins' }
            ].map(pill => (
              <button
                key={pill.key}
                type="button"
                onClick={() => setUserFilter(pill.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '50px',
                  border: userFilter === pill.key ? '2px solid var(--primary)' : '1px solid var(--slate-200)',
                  backgroundColor: userFilter === pill.key ? 'var(--primary-light)' : 'white',
                  color: userFilter === pill.key ? 'var(--primary)' : 'var(--slate-600)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="glass-panel" style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: 'var(--radius-lg)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--slate-200)', color: 'var(--slate-600)', fontWeight: 700 }}>
                  <th style={{ padding: '16px' }}>Full Name</th>
                  <th style={{ padding: '16px' }}>Email Address</th>
                  <th style={{ padding: '16px' }}>Mobile Phone</th>
                  <th style={{ padding: '16px' }}>Role Badge</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Account Security</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(item => {
                  if (userFilter !== 'all' && item.role !== userFilter) return false;
                  if (userSearch.trim()) {
                    const term = userSearch.toLowerCase();
                    return item.name.toLowerCase().includes(term) || item.email.toLowerCase().includes(term) || item.mobile.includes(term);
                  }
                  return true;
                }).map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--slate-200)', transition: 'var(--transition-smooth)' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: '16px', color: 'var(--slate-600)' }}>{item.email}</td>
                    <td style={{ padding: '16px', color: 'var(--slate-600)' }}>{item.mobile}</td>
                    <td style={{ padding: '16px' }}>
                      <span className="badge" style={{
                        backgroundColor: item.role === 'admin' ? 'var(--primary-light)' : item.role === 'shopowner' ? 'var(--secondary-light)' : 'var(--bg-main)',
                        color: item.role === 'admin' ? 'var(--primary)' : item.role === 'shopowner' ? 'var(--secondary)' : 'var(--dark-slate)',
                        fontWeight: 700,
                        fontSize: '0.7rem'
                      }}>
                        {item.role}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleStartEditUser(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--primary)',
                          marginRight: '14px'
                        }}
                        title="Modify Vendor/User Account"
                      >
                        <ShieldCheck size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(item.id)}
                        disabled={item.id === loggedInUser?.id}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: item.id === loggedInUser?.id ? 'not-allowed' : 'pointer',
                          color: item.id === loggedInUser?.id ? 'var(--slate-200)' : 'red',
                          opacity: item.id === loggedInUser?.id ? 0.3 : 1
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: GLOBAL CATEGORIES MANAGER */}
      {tab === 'categories' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
          
          {/* A. Categories creator form */}
          <div style={{ flex: '1 1 320px' }}>
            <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'white' }}>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={18} color="var(--primary)" /> Add Platform Category
              </h3>

              <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="new-cat-name">Category Name</label>
                  <input 
                    id="new-cat-name"
                    name="new-cat-name"
                    type="text" 
                    placeholder="Fresh Dairy, Seafood..." 
                    value={catName} 
                    onChange={(e) => setCatName(e.target.value)} 
                    className="input-field" 
                    required 
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="new-cat-icon">Select Emoji Icon</label>
                  <select 
                    id="new-cat-icon"
                    name="new-cat-icon"
                    value={catIcon} 
                    onChange={(e) => setCatIcon(e.target.value)} 
                    className="input-field" 
                    style={{ padding: '10px 16px' }}
                  >
                    <option value="🥛">Milk / Dairy 🥛</option>
                    <option value="🥩">Steaks / Meat 🥩</option>
                    <option value="🥦">Vegetables 🥦</option>
                    <option value="🏪">General Store 🏪</option>
                    <option value="📦">General Package 📦</option>
                    <option value="🧴">Cosmetics 🧴</option>
                    <option value="🍬">Sweets 🍬</option>
                    <option value="📝">Stationery 📝</option>
                    <option value="🔌">Electronics 🔌</option>
                    <option value="🐾">Pet Store 🐾</option>
                    <option value="🍎">Fruits 🍎</option>
                    <option value="🥤">Beverages 🥤</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '10px' }}>
                  Create Category
                </button>
              </form>
            </div>
          </div>

          {/* B. Dynamic platform categories counter fallback */}
          <div style={{ flex: '1 1 400px' }}>
            <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'white' }}>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Grid size={18} /> Current active indices
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {['Grocery 🛒', 'Bakery 🍞', 'Pharmacy 💊', 'Vegetables 🥦', 'Dairy 🥛', 'Meat 🥩', 'General 🏪', 'Sweets 🍬', 'Stationery 📝', 'Electronics 🔌', 'Pet Store 🐾', 'Fruits 🍎', 'Beverages 🥤'].map((cat) => (
                  <span 
                    key={cat}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--slate-200)',
                      borderRadius: '50px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--dark-slate)'
                    }}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SHOPS MANAGEMENT (Admin view/edit all shops) */}
      {tab === 'shops' && (
        <div className="animate-fade-in">
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
            🏪 All Registered Stores ({allShops.length})
          </h3>

          <div className="glass-panel" style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: 'var(--radius-lg)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--slate-200)', color: 'var(--slate-600)', fontWeight: 700 }}>
                  <th style={{ padding: '14px' }}>Store Name</th>
                  <th style={{ padding: '14px' }}>Category</th>
                  <th style={{ padding: '14px' }}>Owner</th>
                  <th style={{ padding: '14px' }}>City</th>
                  <th style={{ padding: '14px' }}>Phone</th>
                  <th style={{ padding: '14px' }}>Status</th>
                  <th style={{ padding: '14px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allShops.map((shop) => (
                  <tr key={shop.id} style={{ borderBottom: '1px solid var(--slate-200)' }}>
                    <td style={{ padding: '14px', fontWeight: 600, color: 'var(--dark-slate)' }}>{shop.name}</td>
                    <td style={{ padding: '14px', color: 'var(--slate-600)' }}>{shop.category_name}</td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--dark-slate)', fontSize: '0.8rem' }}>{shop.owner_name}</span>
                        <span style={{ color: 'var(--slate-400)', fontSize: '0.7rem' }}>{shop.owner_email}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--slate-600)' }}>{shop.city}</td>
                    <td style={{ padding: '14px', color: 'var(--slate-600)' }}>{shop.mobile}</td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="badge" style={{
                          backgroundColor: shop.is_approved ? 'var(--secondary-light)' : 'var(--warning-light)',
                          color: shop.is_approved ? 'var(--secondary)' : 'var(--warning)',
                          fontSize: '0.65rem',
                          fontWeight: 700
                        }}>
                          {shop.is_approved ? '✓ Approved' : '⏳ Pending'}
                        </span>
                        <span className="badge" style={{
                          backgroundColor: shop.is_active ? 'hsl(200, 76%, 94%)' : 'var(--danger-light)',
                          color: shop.is_active ? 'hsl(200, 76%, 40%)' : 'var(--danger)',
                          fontSize: '0.65rem',
                          fontWeight: 700
                        }}>
                          {shop.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleStartEditShop(shop)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--primary)'
                        }}
                        title="Edit Shop Details"
                      >
                        <ShieldCheck size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT VENDOR/USER ACCOUNT MODAL */}
      {editModal && (
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
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--glass-shadow-large)'
          }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>Modify Platform Account Details</h3>
              <button onClick={() => setEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--slate-600)' }}>&times;</button>
            </div>

            <form onSubmit={handleSaveUserEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="edit-usr-name">Full Name</label>
                <input id="edit-usr-name" name="edit-usr-name" type="text" placeholder="John Doe" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="edit-usr-email">Email Address</label>
                <input id="edit-usr-email" name="edit-usr-email" type="email" placeholder="john@example.com" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="input-field" required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="edit-usr-mobile">Mobile Phone</label>
                <input id="edit-usr-mobile" name="edit-usr-mobile" type="tel" maxLength={10} placeholder="10 digit number" value={editMobile} onChange={(e) => setEditMobile(e.target.value.replace(/\D/g, ''))} className="input-field" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="edit-usr-role">Account Role</label>
                  <select id="edit-usr-role" name="edit-usr-role" value={editRole} onChange={(e) => setEditRole(e.target.value)} className="input-field" style={{ padding: '10px 16px' }}>
                    <option value="customer">Customer</option>
                    <option value="shopowner">Shop Owner</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="edit-usr-status">Account Status</label>
                  <select id="edit-usr-status" name="edit-usr-status" value={editActive} onChange={(e) => setEditActive(parseInt(e.target.value))} className="input-field" style={{ padding: '10px 16px' }}>
                    <option value={1}>Active / Verified</option>
                    <option value={0}>Deactivated / Blocked</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '12px' }}>
                Save Modified Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SHOP DETAILS MODAL (Admin) */}
      {shopEditModal && (
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--glass-shadow-large)'
          }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>Modify Store Configuration</h3>
              <button onClick={() => setShopEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--slate-600)' }}>&times;</button>
            </div>

            <form onSubmit={handleSaveShopEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="admin-shop-name">Store Name</label>
                <input id="admin-shop-name" name="admin-shop-name" type="text" value={shopEditName} onChange={(e) => setShopEditName(e.target.value)} className="input-field" required />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="admin-shop-desc">Description</label>
                <textarea id="admin-shop-desc" name="admin-shop-desc" value={shopEditDesc} onChange={(e) => setShopEditDesc(e.target.value)} className="input-field" style={{ minHeight: '70px', padding: '12px', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="admin-shop-mobile">Mobile Number</label>
                  <input id="admin-shop-mobile" name="admin-shop-mobile" type="tel" maxLength={10} value={shopEditMobile} onChange={(e) => setShopEditMobile(e.target.value.replace(/\D/g, ''))} className="input-field" required />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="admin-shop-city">City</label>
                  <input id="admin-shop-city" name="admin-shop-city" type="text" value={shopEditCity} onChange={(e) => setShopEditCity(e.target.value)} className="input-field" required />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="admin-shop-address">Street Address</label>
                <input id="admin-shop-address" name="admin-shop-address" type="text" value={shopEditAddress} onChange={(e) => setShopEditAddress(e.target.value)} className="input-field" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="admin-shop-pincode">Pincode</label>
                  <input id="admin-shop-pincode" name="admin-shop-pincode" type="text" maxLength={6} value={shopEditPincode} onChange={(e) => setShopEditPincode(e.target.value.replace(/\D/g, ''))} className="input-field" required />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="admin-shop-lat">Latitude</label>
                  <input id="admin-shop-lat" name="admin-shop-lat" type="number" step="0.000001" value={shopEditLat} onChange={(e) => setShopEditLat(e.target.value)} className="input-field" />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="admin-shop-lng">Longitude</label>
                  <input id="admin-shop-lng" name="admin-shop-lng" type="number" step="0.000001" value={shopEditLng} onChange={(e) => setShopEditLng(e.target.value)} className="input-field" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="admin-shop-open">Open Time</label>
                  <input id="admin-shop-open" name="admin-shop-open" type="text" placeholder="09:00:00" value={shopEditOpen} onChange={(e) => setShopEditOpen(e.target.value)} className="input-field" />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="admin-shop-close">Close Time</label>
                  <input id="admin-shop-close" name="admin-shop-close" type="text" placeholder="21:00:00" value={shopEditClose} onChange={(e) => setShopEditClose(e.target.value)} className="input-field" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="admin-shop-approved">Approval Status</label>
                  <select id="admin-shop-approved" name="admin-shop-approved" value={shopEditApproved} onChange={(e) => setShopEditApproved(parseInt(e.target.value))} className="input-field" style={{ padding: '10px 16px' }}>
                    <option value={1}>✓ Approved</option>
                    <option value={0}>⏳ Pending / Rejected</option>
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="admin-shop-active">Active Status</label>
                  <select id="admin-shop-active" name="admin-shop-active" value={shopEditActive} onChange={(e) => setShopEditActive(parseInt(e.target.value))} className="input-field" style={{ padding: '10px 16px' }}>
                    <option value={1}>Active</option>
                    <option value={0}>Disabled</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '12px' }}>
                Save Store Modifications
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
