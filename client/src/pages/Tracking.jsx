// client/src/pages/Tracking.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, MapPin, Phone, ShieldCheck, CheckCircle2, ChevronRight, AlertCircle, ShoppingBag, X } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function Tracking({ navigate, orderId }) {
  const { token } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const isDelivery = order?.delivery_mode === 'delivery';
  const steps = [
    { key: 'placed', label: 'Placed', icon: '📝', desc: 'Order sent to merchant' },
    { key: 'accepted', label: 'Accepted', icon: '🤝', desc: 'Merchant accepted order' },
    { key: 'packing', label: 'Packing', icon: '📦', desc: 'Items being packed fresh' },
    { 
      key: 'ready', 
      label: isDelivery ? 'Out for Delivery' : 'Ready', 
      icon: isDelivery ? '🛵' : '⚡', 
      desc: isDelivery ? 'Rider is bringing your order!' : 'Ready for fast pickup!' 
    },
    { 
      key: 'picked', 
      label: isDelivery ? 'Delivered' : 'Completed', 
      icon: '🎉', 
      desc: isDelivery ? 'Order dropped off safely' : 'Picked up successfully' 
    }
  ];

  const fetchTracking = async (showShimmer = false) => {
    if (showShimmer) setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/tracking`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        setItems(data.items);
        setTimeline(data.timeline);
      } else {
        const errData = await response.json();
        setError(errData.message || 'Failed to load tracking data.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed.');
    } finally {
      if (showShimmer) setLoading(false);
    }
  };

  // Poll for tracking details in real time
  useEffect(() => {
    fetchTracking(true);
    
    // Auto-poll tracking changes every 4.5 seconds for instant state update response
    const interval = setInterval(() => {
      fetchTracking(false);
    }, 4500);

    return () => clearInterval(interval);
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel your GrabNGo order?')) return;
    setCancelling(true);
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchTracking(false);
      } else {
        const errData = await response.json();
        alert(errData.message || 'Cannot cancel order.');
      }
    } catch (err) {
      console.error(err);
      alert('Error cancelling order.');
    } finally {
      setCancelling(false);
    }
  };

  const getStepIndex = (status) => {
    if (status === 'cancelled') return -1;
    return steps.findIndex(s => s.key === status);
  };

  if (loading) {
    return (
      <div className="content-wrapper flex-center" style={{ minHeight: 'calc(100vh - 180px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="shimmer-bg" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--slate-600)', fontWeight: 600 }}>Loading Tracking Panel...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="content-wrapper flex-center" style={{ minHeight: 'calc(100vh - 180px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <p style={{ color: 'var(--slate-600)', fontWeight: 600, marginTop: '16px' }}>{error || 'Order tracking not found.'}</p>
          <button onClick={() => navigate('home')} className="btn btn-primary" style={{ marginTop: '16px' }}>Browse Stores</button>
        </div>
      </div>
    );
  }

  const activeStepIdx = getStepIndex(order.order_status);

  return (
    <div className="content-wrapper animate-fade-in" style={{ padding: '24px 16px' }}>
      
      {/* ORDER SUMMARY BANNER HEADER */}
      <section style={{
        background: 'linear-gradient(135deg, var(--dark-slate) 0%, hsl(222, 47%, 20%) 100%)',
        color: 'white',
        padding: '32px 24px',
        borderRadius: 'var(--radius-xl)',
        marginBottom: '32px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ORDER REFERENCE</div>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', color: 'white', margin: '4px 0 8px' }}>
            {order.order_number}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: 'var(--slate-400)', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} color="var(--primary)" />
              <span>Est. Ready: <strong>{order.estimated_time || 25} mins</strong></span>
            </span>
            <span>•</span>
            <span style={{ textTransform: 'capitalize' }}>Payment Mode: {order.payment_mode} ({order.payment_status})</span>
          </div>
        </div>

        {/* Live Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {order.order_status === 'cancelled' ? (
            <span className="badge badge-status" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', fontSize: '0.9rem', padding: '8px 16px', fontWeight: 700 }}>
              ❌ ORDER CANCELLED
            </span>
          ) : order.order_status === 'picked' ? (
            <span className="badge badge-status" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', fontSize: '0.9rem', padding: '8px 16px', fontWeight: 700 }}>
              {order.delivery_mode === 'delivery' ? '🎉 ORDER DELIVERED' : '🎉 COMPLETED'}
            </span>
          ) : order.order_status === 'ready' ? (
            <span className="badge badge-status animate-pulse-status" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', fontSize: '0.9rem', padding: '8px 16px', fontWeight: 700 }}>
              {order.delivery_mode === 'delivery' ? '🛵 OUT FOR DELIVERY' : '⚡ READY FOR PICKUP'}
            </span>
          ) : (
            <span className="badge badge-status animate-pulse-status" style={{ backgroundColor: 'var(--warning-light)', color: 'hsl(40, 95%, 40%)', fontSize: '0.9rem', padding: '8px 16px', fontWeight: 700 }}>
              ⏳ {order.order_status === 'placed' ? 'ORDER PLACED' : order.order_status === 'accepted' ? 'ORDER ACCEPTED' : 'PACKING...'}
            </span>
          )}
        </div>
      </section>

      {/* TWO-COLUMN LAYOUT: TRACKING TIMELINE vs QR SCANNER & DETAILS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
        
        {/* LEFT COLUMN: LIVE VISUAL TIMELINE */}
        <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '32px', backgroundColor: 'white' }}>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', marginBottom: '24px' }}>
              {order.delivery_mode === 'delivery' ? 'Delivery Tracking Progress' : 'Pickup Tracking Progress'}
            </h3>

            {order.order_status === 'cancelled' ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                <AlertCircle size={20} />
                <strong>This order has been cancelled and refunded (if applicable).</strong>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '32px' }}>
                
                {/* Timeline connector bar */}
                <div style={{
                  position: 'absolute',
                  left: '11px',
                  top: '12px',
                  bottom: '12px',
                  width: '3px',
                  backgroundColor: 'var(--slate-200)',
                  zIndex: 0
                }}>
                  {/* Active fill */}
                  <div style={{
                    width: '100%',
                    height: `${(Math.max(0, activeStepIdx) / (steps.length - 1)) * 100}%`,
                    backgroundColor: 'var(--secondary)',
                    transition: 'height 0.8s ease-in-out'
                  }}></div>
                </div>

                {/* Timeline nodes */}
                {steps.map((step, idx) => {
                  const isCompleted = idx <= activeStepIdx;
                  const isActive = idx === activeStepIdx;
                  
                  return (
                    <div 
                      key={step.key} 
                      style={{
                        display: 'flex',
                        gap: '16px',
                        marginBottom: idx === steps.length - 1 ? 0 : '24px',
                        position: 'relative',
                        zIndex: 1
                      }}
                    >
                      {/* Circle node indicator */}
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isCompleted ? 'var(--secondary)' : 'white',
                        border: '3px solid',
                        borderColor: isCompleted ? 'var(--secondary)' : 'var(--slate-200)',
                        color: isCompleted ? 'white' : 'var(--slate-400)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        marginLeft: '-43px',
                        transition: 'var(--transition-smooth)'
                      }}>
                        {isCompleted ? '✓' : ''}
                      </div>

                      {/* Info node label */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1rem' }}>{step.icon}</span>
                          <h4 style={{
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: isActive ? 'var(--primary)' : isCompleted ? 'var(--dark-slate)' : 'var(--slate-400)'
                          }}>
                            {step.label}
                          </h4>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: isCompleted ? 'var(--slate-600)' : 'var(--slate-400)', marginTop: '2px' }}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SYSTEM EVENTS LOG TIMELINE DETAILS */}
          <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
              System Logs Timeline
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {timeline.map((log) => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--slate-600)', borderBottom: '1px solid var(--slate-100)', paddingBottom: '8px' }}>
                  <span>{log.note}</span>
                  <span style={{ color: 'var(--slate-400)', fontWeight: 500 }}>
                    {new Date(log.changed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QR PICKUP BARCODE & CATALOG ITEMS */}
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* DIGITAL SCANNER SECURE QR CODE */}
          {!order.cancelled_by && order.order_status !== 'cancelled' && order.delivery_mode !== 'delivery' && (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{
                border: '2px solid var(--primary-light)',
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'white',
                display: 'inline-block',
                boxShadow: 'var(--glass-shadow)'
              }}>
                {/* SVG SECURE QR CODE GRAPHIC */}
                <svg width="140" height="140" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid blocks of mock QR */}
                  <rect width="100" height="100" fill="white" />
                  {/* Position markers */}
                  <rect x="0" y="0" width="30" height="30" fill="var(--dark-slate)" />
                  <rect x="5" y="5" width="20" height="20" fill="white" />
                  <rect x="10" y="10" width="10" height="10" fill="var(--dark-slate)" />

                  <rect x="70" y="0" width="30" height="30" fill="var(--dark-slate)" />
                  <rect x="75" y="5" width="20" height="20" fill="white" />
                  <rect x="80" y="10" width="10" height="10" fill="var(--dark-slate)" />

                  <rect x="0" y="70" width="30" height="30" fill="var(--dark-slate)" />
                  <rect x="5" y="75" width="20" height="20" fill="white" />
                  <rect x="10" y="80" width="10" height="10" fill="var(--dark-slate)" />

                  {/* Noise simulation dots */}
                  <rect x="40" y="10" width="10" height="10" fill="var(--dark-slate)" />
                  <rect x="55" y="15" width="5" height="10" fill="var(--dark-slate)" />
                  <rect x="45" y="45" width="15" height="15" fill="var(--dark-slate)" />
                  <rect x="15" y="40" width="10" height="10" fill="var(--dark-slate)" />
                  <rect x="75" y="45" width="10" height="15" fill="var(--dark-slate)" />
                  <rect x="40" y="75" width="20" height="10" fill="var(--dark-slate)" />
                  <rect x="70" y="70" width="15" height="15" fill="var(--dark-slate)" />
                  <rect x="85" y="85" width="10" height="10" fill="var(--dark-slate)" />
                </svg>
              </div>

              <div>
                <h4 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <ShieldCheck size={18} color="var(--secondary)" /> Secure Pickup Badge
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginTop: '4px' }}>
                  Show this QR code at the shop counter. The merchant will scan it to verify packaging.
                </p>
              </div>
            </div>
          )}

          {/* DELIVERY DESTINATION CARD */}
          {order.delivery_mode === 'delivery' && (
            <div className="glass-panel animate-scale-in" style={{ padding: '20px 24px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', borderBottom: '1px solid var(--slate-200)', paddingBottom: '8px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🛵 Delivery Destination
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                <div><strong>Recipient Name:</strong> {order.delivery_address_text?.split('|')[0]?.trim() || 'N/A'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> <span>{order.delivery_address_text?.split('(')[1]?.split(')')[0] || 'N/A'}</span></div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '6px' }}><MapPin size={14} style={{ marginTop: '2px' }} /> <span>{order.delivery_address_text?.split('|')[1]?.trim() || 'N/A'}</span></div>
              </div>
            </div>
          )}

          {/* STORE CONTACT & DETAILS CARD */}
          <div className="glass-panel" style={{ padding: '20px 24px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', borderBottom: '1px solid var(--slate-200)', paddingBottom: '8px' }}>
              🏪 Store Details
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--slate-600)' }}>
              <div><strong>Name:</strong> {order.shop_name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> <span>{order.shop_address}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> <span>{order.shop_mobile}</span></div>
            </div>
          </div>

          {/* PACKAGE ITEMS SUMMARY LIST */}
          <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', borderBottom: '1px solid var(--slate-200)', paddingBottom: '8px', marginBottom: '12px' }}>
              📦 Items Packed
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((item) => (
                <div key={item.id} className="flex-between" style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                  <span>{item.item_name} <strong style={{ color: 'var(--dark-slate)' }}>x{item.quantity}</strong></span>
                  <span style={{ fontWeight: 600 }}>₹{parseFloat(item.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--slate-200)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', color: 'var(--dark-slate)' }}>
              <span>Grand Total:</span>
              <span style={{ color: 'var(--primary)' }}>₹{parseFloat(order.total_amount).toFixed(2)}</span>
            </div>
          </div>

          {/* CANCEL ORDER IN PLACED STATE */}
          {order.order_status === 'placed' && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="btn btn-danger"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px' }}
            >
              <X size={16} />
              {cancelling ? 'Sending Cancellation...' : 'Cancel GrabNGo Order'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .animate-pulse-status {
          animation: pulse-status 1.5s infinite alternate;
        }
        @keyframes pulse-status {
          0% { opacity: 0.7; transform: scale(0.96); }
          100% { opacity: 1; transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}
