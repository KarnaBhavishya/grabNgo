// client/src/pages/MyOrders.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Clock, ChevronRight, Package, CheckCircle2, XCircle, Filter, Search } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function MyOrders({ navigate }) {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'active', 'completed', 'cancelled'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/orders/customer`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (err) {
        console.error('Fetch orders error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed': return { bg: 'hsl(40, 95%, 93%)', color: 'hsl(40, 95%, 40%)' };
      case 'accepted': return { bg: 'hsl(200, 76%, 94%)', color: 'hsl(200, 76%, 40%)' };
      case 'packing': return { bg: 'var(--primary-light)', color: 'var(--primary)' };
      case 'ready': return { bg: 'var(--secondary-light)', color: 'var(--secondary)' };
      case 'picked': return { bg: 'hsl(152, 76%, 94%)', color: 'hsl(152, 76%, 30%)' };
      case 'cancelled': return { bg: 'var(--danger-light)', color: 'var(--danger)' };
      default: return { bg: 'var(--bg-main)', color: 'var(--slate-600)' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'placed': return '📝';
      case 'accepted': return '🤝';
      case 'packing': return '📦';
      case 'ready': return '⚡';
      case 'picked': return '🎉';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const filteredOrders = orders.filter(o => {
    // Filter by tab
    if (filterTab === 'active' && !['placed', 'accepted', 'packing', 'ready'].includes(o.order_status)) return false;
    if (filterTab === 'completed' && o.order_status !== 'picked') return false;
    if (filterTab === 'cancelled' && o.order_status !== 'cancelled') return false;

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (o.order_number || '').toLowerCase().includes(term) ||
        (o.shop_name || '').toLowerCase().includes(term)
      );
    }
    return true;
  });

  const filterTabs = [
    { key: 'all', label: 'All Orders', count: orders.length },
    { key: 'active', label: 'Active', count: orders.filter(o => ['placed', 'accepted', 'packing', 'ready'].includes(o.order_status)).length },
    { key: 'completed', label: 'Completed', count: orders.filter(o => o.order_status === 'picked').length },
    { key: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.order_status === 'cancelled').length }
  ];

  if (loading) {
    return (
      <div className="content-wrapper flex-center" style={{ minHeight: 'calc(100vh - 180px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="shimmer-bg" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--slate-600)', fontWeight: 600 }}>Loading Your Order History...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper animate-fade-in" style={{ padding: '24px 16px' }}>

      {/* HEADER BANNER */}
      <section style={{
        background: 'linear-gradient(135deg, var(--dark-slate) 0%, hsl(222, 47%, 20%) 100%)',
        color: 'white',
        padding: '28px 24px',
        borderRadius: 'var(--radius-xl)',
        marginBottom: '28px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            backgroundColor: 'rgba(255,107,38,0.2)',
            color: 'var(--primary)',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', color: 'white' }}>My Orders</h2>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', marginTop: '2px' }}>
              {orders.length} total orders placed
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
          <input
            type="text"
            placeholder="Search by order # or shop..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              borderRadius: '50px',
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 500,
              outline: 'none'
            }}
          />
        </div>
      </section>

      {/* FILTER TABS */}
      <section style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            style={{
              padding: '8px 18px',
              borderRadius: '50px',
              border: filterTab === tab.key ? '2px solid var(--primary)' : '1px solid var(--slate-200)',
              backgroundColor: filterTab === tab.key ? 'var(--primary-light)' : 'white',
              color: filterTab === tab.key ? 'var(--primary)' : 'var(--slate-600)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'var(--transition-smooth)'
            }}
          >
            {tab.label}
            <span style={{
              backgroundColor: filterTab === tab.key ? 'var(--primary)' : 'var(--slate-200)',
              color: filterTab === tab.key ? 'white' : 'var(--slate-600)',
              padding: '2px 8px',
              borderRadius: '50px',
              fontSize: '0.7rem',
              fontWeight: 800
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </section>

      {/* ORDERS LIST */}
      {filteredOrders.length === 0 ? (
        <div className="animate-scale-in" style={{
          textAlign: 'center',
          padding: '60px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ fontSize: '4rem' }}>📭</div>
          <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', color: 'var(--dark-slate)' }}>
            No Orders Found
          </h3>
          <p style={{ color: 'var(--slate-600)', maxWidth: '350px' }}>
            {filterTab === 'all'
              ? "You haven't placed any orders yet. Browse shops to get started!"
              : `No ${filterTab} orders to display.`}
          </p>
          <button onClick={() => navigate('home')} className="btn btn-primary" style={{ marginTop: '8px' }}>
            Browse Stores
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredOrders.map((order) => {
            const statusStyle = getStatusColor(order.order_status);
            return (
              <div
                key={order.id}
                onClick={() => navigate('tracking', { orderId: order.id })}
                className="glass-panel glass-panel-hover"
                style={{
                  padding: '20px 24px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'var(--transition-smooth)',
                  borderLeft: `4px solid ${statusStyle.color}`
                }}
              >
                {/* Left: Order details */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: '1 1 350px' }}>
                  {/* Shop photo */}
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <img
                      src={order.shop_photo || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&q=80'}
                      alt={order.shop_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>{order.order_number}</span>
                      <span className="badge" style={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 10px',
                        textTransform: 'uppercase'
                      }}>
                        {getStatusIcon(order.order_status)} {order.order_status}
                      </span>
                    </div>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--dark-slate)' }}>{order.shop_name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                      </span>
                      <span>•</span>
                      <span style={{ textTransform: 'capitalize' }}>{order.payment_mode} ({order.payment_status})</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount + arrow */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--dark-slate)' }}>
                      ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600 }}>Total Amount</div>
                  </div>
                  <ChevronRight size={20} color="var(--slate-400)" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
