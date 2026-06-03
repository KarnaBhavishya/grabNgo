import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { 
  ShoppingBag, ArrowLeft, Trash2, Plus, Minus, CreditCard, Banknote, 
  ShoppingCart, Lock, Sparkles, CheckCircle2, MapPin, Home, Briefcase, 
  PlusCircle, Trash, Check, User, Phone, Navigation 
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function Cart({ navigate }) {
  const { token } = useAuth();
  const {
    cartItems,
    cartShop,
    manualList,
    uploadedImage,
    specialInstructions,
    paymentMode,
    setSpecialInstructions,
    setPaymentMode,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    platformFee,
    totalAmount
  } = useCart();

  const { location } = useLocation();

  const [loading, setLoading] = useState(false);
  const [gatewaySimulated, setGatewaySimulated] = useState(false);
  const [error, setError] = useState('');

  // Delivery options & addresses states
  const [deliveryMode, setDeliveryMode] = useState('pickup'); // pickup or delivery
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Address form states
  const [formLabel, setFormLabel] = useState('Home');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formTakerName, setFormTakerName] = useState('');
  const [formTakerMobile, setFormTakerMobile] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const isCartEmpty = cartItems.length === 0 && !manualList.trim();

  // Fetch addresses
  const fetchAddresses = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
        if (data.length > 0) {
          setSelectedAddressId(prev => prev || data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  useEffect(() => {
    if (token && deliveryMode === 'delivery') {
      fetchAddresses();
    }
  }, [token, deliveryMode]);

  // Prepopulate address form from current location access state
  useEffect(() => {
    if (showAddressModal && location?.address) {
      const cleanAddr = location.address.replace('📍', '').trim();
      setFormAddress(cleanAddr);
      const parts = cleanAddr.split(',');
      if (parts.length > 1) {
        setFormCity(parts[parts.length - 1].trim());
      } else {
        setFormCity('Bengaluru');
      }
    }
  }, [showAddressModal, location]);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formAddress || !formCity || !formPincode || !formTakerName || !formTakerMobile) {
      setFormError('Please fill out all address and receiver details.');
      return;
    }

    setFormSaving(true);
    try {
      const response = await fetch(`${API_BASE}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          label: formLabel,
          address: formAddress,
          city: formCity,
          pincode: formPincode,
          lat: location.lat || 12.9716,
          lng: location.lng || 77.5946,
          taker_name: formTakerName,
          taker_mobile: formTakerMobile
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save address.');
      }

      await fetchAddresses();
      setSelectedAddressId(data.addressId);

      // Reset fields
      setFormAddress('');
      setFormCity('');
      setFormPincode('');
      setFormTakerName('');
      setFormTakerMobile('');
      setFormLabel('Home');
      setShowAddressModal(false);
    } catch (err) {
      setFormError(err.message || 'Error saving address. Please try again.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${API_BASE}/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setAddresses(prev => prev.filter(a => a.id !== addressId));
        if (selectedAddressId === addressId) {
          setSelectedAddressId(null);
        }
      }
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  const handleOrderSubmit = async () => {
    setError('');
    if (!token) {
      setError('Please log in to complete your checkout.');
      navigate('login');
      return;
    }

    if (deliveryMode === 'delivery' && !selectedAddressId) {
      setError('Please select or add a delivery address to complete your checkout.');
      return;
    }

    setLoading(true);

    const activeAddress = addresses.find(a => a.id === selectedAddressId);
    const addressText = activeAddress 
      ? `[${activeAddress.label}] ${activeAddress.taker_name} (${activeAddress.taker_mobile}) | ${activeAddress.address}, ${activeAddress.city} - ${activeAddress.pincode}`
      : null;

    const finalTotalAmount = deliveryMode === 'delivery' ? totalAmount + 30.00 : totalAmount;

    // If payment mode is online, simulate a Razorpay high-fidelity payment popup before POST
    if (paymentMode === 'online') {
      setGatewaySimulated(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGatewaySimulated(false);
    }

    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shop_id: cartShop.id,
          items: cartItems,
          manual_list: manualList,
          uploaded_image: uploadedImage,
          subtotal: subtotal,
          platform_fee: platformFee,
          total_amount: finalTotalAmount,
          payment_mode: paymentMode,
          special_note: specialInstructions,
          delivery_mode: deliveryMode,
          delivery_address_text: addressText
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit order.');
      }

      // Clear local cart states
      clearCart();

      // Redirection to tracking page
      navigate('tracking', { orderId: data.orderId });

    } catch (err) {
      console.error(err);
      setError(err.message || 'Connection failure. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  if (isCartEmpty) {
    return (
      <div className="content-wrapper flex-center" style={{ minHeight: 'calc(100vh - 180px)' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }} className="animate-scale-in">
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem'
          }}>
            <ShoppingCart size={36} />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)' }}>Your Basket is Empty</h3>
          <p style={{ color: 'var(--slate-600)', maxWidth: '320px', margin: '0 auto' }}>
            Browse nearby stores to add fresh grocery catalog items or snap your handwriting lists!
          </p>
          <button onClick={() => navigate('home')} className="btn btn-primary" style={{ marginTop: '8px' }}>
            Browse Stores Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper animate-fade-in" style={{ padding: '24px 16px' }}>
      
      {/* HEADER ROW */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button 
          onClick={() => navigate('shop-detail', { shopId: cartShop.id })} 
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--slate-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px'
          }}
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)' }}>Checkout Summary</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
            Ordering from <strong style={{ color: 'var(--dark-slate)' }}>{cartShop.name}</strong>
          </p>
        </div>
      </div>

      {error && (
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
          ⚠️ {error}
        </div>
      )}

      {/* THREE-COLUMN LAYOUT STRUCTURE */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
        
        {/* LEFT COLUMN: BASKET ITEMS & SPECIFICATIONS */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CATALOG ITEMS LIST */}
          {cartItems.length > 0 && (
            <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'white' }}>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} color="var(--primary)" />
                Itemized Basket
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {cartItems.map((item) => (
                  <div 
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      paddingBottom: '16px',
                      borderBottom: '1px solid var(--slate-200)'
                    }}
                  >
                    {/* Item info */}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--dark-slate)' }}>{item.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>₹{parseFloat(item.price).toFixed(2)} / {item.unit || 'unit'}</p>
                    </div>

                    {/* Quantity Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-main)', padding: '4px 8px', borderRadius: '50px' }}>
                      <button onClick={() => updateQuantity(item.id, -1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-600)', display: 'flex' }}><Minus size={12} /></button>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-600)', display: 'flex' }}><Plus size={12} /></button>
                    </div>

                    {/* Price calculation & remove */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--dark-slate)', minWidth: '60px', textAlign: 'right' }}>
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                      
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)', transition: 'var(--transition-smooth)' }}
                        className="btn-trash-hover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CUSTOM RECEIPT MANUALLY UPLOADED SUMMARY */}
          {manualList.trim() && (
            <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'white' }}>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', marginBottom: '16px', color: 'var(--primary)' }}>
                📝 Custom List Included
              </h3>
              <div style={{
                backgroundColor: 'var(--bg-main)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                color: 'var(--slate-600)',
                whiteSpace: 'pre-wrap',
                border: '1px solid var(--slate-200)',
                lineHeight: 1.5
              }}>
                {manualList}
              </div>
              {uploadedImage && (
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📸 Handwritten list photo attached</span>
                </div>
              )}
            </div>
          )}

          {/* PACKAGING NOTES AND SPECIAL INSTRUCTIONS */}
          <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', marginBottom: '12px' }}>
              📦 Packaging Instructions
            </h3>
            <textarea
              rows={3}
              placeholder="E.g., Please check dates, pack dairy products together, or instructions for the packing staff..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="input-field"
              style={{ width: '100%', resize: 'none', fontSize: '0.85rem', borderRadius: 'var(--radius-md)' }}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: INVOICING & PAYMENT */}
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* ORDER MODE SELECTION */}
          <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={18} color="var(--primary)" />
              Fulfillment Mode
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button"
                onClick={() => setDeliveryMode('pickup')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid',
                  borderColor: deliveryMode === 'pickup' ? 'var(--primary)' : 'var(--slate-200)',
                  backgroundColor: deliveryMode === 'pickup' ? 'var(--primary-light)' : 'white',
                  color: deliveryMode === 'pickup' ? 'var(--primary)' : 'var(--slate-600)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🚶</span>
                <span style={{ fontWeight: 700 }}>Self Pickup</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-600)', fontWeight: 400 }}>No extra fees</span>
              </button>
              <button 
                type="button"
                onClick={() => setDeliveryMode('delivery')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid',
                  borderColor: deliveryMode === 'delivery' ? 'var(--primary)' : 'var(--slate-200)',
                  backgroundColor: deliveryMode === 'delivery' ? 'var(--primary-light)' : 'white',
                  color: deliveryMode === 'delivery' ? 'var(--primary)' : 'var(--slate-600)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🛵</span>
                <span style={{ fontWeight: 700 }}>Home Delivery</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-600)', fontWeight: 400 }}>Flat ₹30.00 surcharge</span>
              </button>
            </div>
          </div>

          {/* SAVED ADDRESSES SECTION (IF HOME DELIVERY IS CHOSEN) */}
          {deliveryMode === 'delivery' && (
            <div className="glass-panel animate-scale-in" style={{ padding: '24px', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="var(--primary)" />
                  Select Address
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <PlusCircle size={14} />
                  Add New
                </button>
              </div>

              {addresses.length === 0 ? (
                <div style={{
                  padding: '24px 12px',
                  border: '2px dashed var(--slate-200)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  color: 'var(--slate-600)',
                  fontSize: '0.85rem'
                }}>
                  No saved addresses found.<br/>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                    Add one using the button above to enable delivery checkout.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        style={{
                          border: '2px solid',
                          borderColor: isSelected ? 'var(--primary)' : 'var(--slate-200)',
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'white',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 14px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'var(--transition-smooth)',
                          display: 'flex',
                          gap: '10px'
                        }}
                      >
                        <div style={{ color: isSelected ? 'var(--primary)' : 'var(--slate-400)', marginTop: '2px' }}>
                          {addr.label?.toLowerCase() === 'home' && <Home size={16} />}
                          {addr.label?.toLowerCase() === 'work' && <Briefcase size={16} />}
                          {addr.label?.toLowerCase() !== 'home' && addr.label?.toLowerCase() !== 'work' && <MapPin size={16} />}
                        </div>
                        
                        <div style={{ flex: 1, paddingRight: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark-slate)' }}>
                              {addr.label}
                            </span>
                            {isSelected && (
                              <span style={{
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '10px'
                              }}>
                                SELECTED
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--dark-slate)', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={10} /> {addr.taker_name}
                          </p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--dark-slate)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={10} /> {addr.taker_mobile}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--slate-600)', marginTop: '6px', lineHeight: 1.3 }}>
                            {addr.address}, {addr.city} - {addr.pincode}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteAddress(addr.id, e)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '10px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            padding: '4px',
                            transition: 'var(--transition-smooth)'
                          }}
                          className="btn-trash-hover"
                          title="Remove Address"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PAYMENT SELECTOR */}
          <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
              💳 Choose Payment Mode
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Online payment option */}
              <div 
                onClick={() => setPaymentMode('online')}
                style={{
                  border: '2px solid',
                  borderColor: paymentMode === 'online' ? 'var(--primary)' : 'var(--slate-200)',
                  backgroundColor: paymentMode === 'online' ? 'var(--primary-light)' : 'white',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <div style={{
                  color: paymentMode === 'online' ? 'var(--primary)' : 'var(--slate-600)',
                  backgroundColor: paymentMode === 'online' ? 'white' : 'var(--bg-main)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CreditCard size={18} />
                </div>
                
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--dark-slate)', fontWeight: 600 }}>Pay Online</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--slate-600)' }}>Simulated secure Razorpay checkout</p>
                </div>
              </div>

              {/* Cash option */}
              <div 
                onClick={() => setPaymentMode('cash')}
                style={{
                  border: '2px solid',
                  borderColor: paymentMode === 'cash' ? 'var(--primary)' : 'var(--slate-200)',
                  backgroundColor: paymentMode === 'cash' ? 'var(--primary-light)' : 'white',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <div style={{
                  color: paymentMode === 'cash' ? 'var(--primary)' : 'var(--slate-600)',
                  backgroundColor: paymentMode === 'cash' ? 'white' : 'var(--bg-main)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Banknote size={18} />
                </div>
                
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--dark-slate)', fontWeight: 600 }}>
                    {deliveryMode === 'delivery' ? 'Cash on Delivery' : 'Cash on Pickup'}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--slate-600)' }}>
                    {deliveryMode === 'delivery' ? 'Pay at your doorstep on delivery' : 'Pay at the counter when you grab items'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FINAL RECEIPT SUMS */}
          <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
              🧾 Receipt Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--slate-600)', fontWeight: 500 }}>
              <div className="flex-between">
                <span>Items Subtotal:</span>
                <span style={{ color: 'var(--dark-slate)', fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex-between">
                <span>Platform Packaging Fee:</span>
                <span style={{ color: 'var(--dark-slate)', fontWeight: 600 }}>₹{platformFee.toFixed(2)}</span>
              </div>

              {deliveryMode === 'delivery' && (
                <div className="flex-between animate-fade-in" style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                  <span>Delivery Charge:</span>
                  <span>₹30.00</span>
                </div>
              )}

              <div style={{ height: '1px', backgroundColor: 'var(--slate-200)', margin: '4px 0' }}></div>

              <div className="flex-between" style={{ fontSize: '1.15rem', color: 'var(--dark-slate)', fontWeight: 800 }}>
                <span>Grand Total:</span>
                <span style={{ color: 'var(--primary)' }}>₹{(deliveryMode === 'delivery' ? totalAmount + 30.00 : totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleOrderSubmit}
              disabled={loading}
              className="btn btn-primary btn-block"
              style={{ marginTop: '20px', padding: '14px' }}
            >
              {loading ? 'Securing Transaction...' : 'Place GrabNGo Order'}
            </button>

            {/* Security Note badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginTop: '16px', fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600 }}>
              <Lock size={12} />
              <span>SECURED PLATFORM CHECKS</span>
            </div>
          </div>
        </div>
      </div>

      {/* RAZORPAY GATEWAY CHECKOUT SIMULATED DIALOG MODAL */}
      {gatewaySimulated && (
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
            padding: '40px 32px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            borderRadius: 'var(--radius-xl)'
          }}>
            {/* Razorpay Logo styling */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.25rem', fontWeight: 900, color: '#0029b3' }}>
              <Sparkles size={20} color="#0070f3" fill="#0070f3" />
              <span>Razorpay <span style={{ color: '#0070f3' }}>Gateway</span></span>
            </div>
            
            <div style={{ position: 'relative', width: '70px', height: '70px' }}>
              {/* Spinner */}
              <div className="gateway-spinner"></div>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#0070f3' }}>
                <CreditCard size={28} />
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>Processing Online Checkout</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginTop: '6px' }}>
                Authenticating double-token security handshake for ₹{(deliveryMode === 'delivery' ? totalAmount + 30.00 : totalAmount).toFixed(2)}. Please do not exit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW ADDRESS MODAL DIALOG */}
      {showAddressModal && (
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
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-panel animate-scale-in" style={{
            backgroundColor: 'white',
            padding: '28px 24px',
            width: '100%',
            maxWidth: '480px',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--glass-shadow-large)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', color: 'var(--dark-slate)' }}>
                Add Delivery Address
              </h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--slate-400)'
                }}
              >
                ×
              </button>
            </div>

            {formError && (
              <div style={{
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 500
              }}>
                ⚠️ {formError}
              </div>
            )}

            {/* Geocoding Mapping Reference */}
            <div style={{
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--slate-200)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              fontSize: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{ fontWeight: 700, color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Navigation size={10} color="var(--primary)" /> Mapping Reference Coordinates
              </span>
              <p style={{ color: 'var(--dark-slate)', fontWeight: 600 }}>{location?.address || 'Detecting Location...'}</p>
              <p style={{ color: 'var(--slate-400)', fontSize: '0.7rem' }}>Lat: {location?.lat?.toFixed(5) || 12.9716} | Lng: {location?.lng?.toFixed(5) || 77.5946}</p>
            </div>

            <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                {/* Taker Name */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="input-label" style={{ fontSize: '0.8rem' }}>Receiver's Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. John Doe"
                    value={formTakerName}
                    onChange={(e) => setFormTakerName(e.target.value)}
                    className="input-field"
                    style={{ padding: '10px 12px', fontSize: '0.85rem' }}
                  />
                </div>
                {/* Taker Mobile */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="input-label" style={{ fontSize: '0.8rem' }}>Phone Number</label>
                  <input
                    type="tel"
                    required
                    maxLength={15}
                    placeholder="E.g. 9876543210"
                    value={formTakerMobile}
                    onChange={(e) => setFormTakerMobile(e.target.value)}
                    className="input-field"
                    style={{ padding: '10px 12px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Complete Address */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="input-label" style={{ fontSize: '0.8rem' }}>Flat, House No, Building, Street</label>
                <textarea
                  rows={2}
                  required
                  placeholder="E.g. Flat 302, Green Meadows Apartment, Road No 4"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="input-field"
                  style={{ padding: '10px 12px', fontSize: '0.85rem', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {/* City */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="input-label" style={{ fontSize: '0.8rem' }}>City</label>
                  <input
                    type="text"
                    required
                    placeholder="Bengaluru"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="input-field"
                    style={{ padding: '10px 12px', fontSize: '0.85rem' }}
                  />
                </div>
                {/* Pincode */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="input-label" style={{ fontSize: '0.8rem' }}>Pincode</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="560001"
                    value={formPincode}
                    onChange={(e) => setFormPincode(e.target.value)}
                    className="input-field"
                    style={{ padding: '10px 12px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Label selector: Home, Work, Other */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="input-label" style={{ fontSize: '0.8rem' }}>Address Tag</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['Home', 'Work', 'Other'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setFormLabel(lbl)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: formLabel === lbl ? 'var(--primary)' : 'var(--slate-200)',
                        backgroundColor: formLabel === lbl ? 'var(--primary-light)' : 'white',
                        color: formLabel === lbl ? 'var(--primary)' : 'var(--slate-600)',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      {lbl === 'Home' && '🏠 '}
                      {lbl === 'Work' && '💼 '}
                      {lbl === 'Other' && '📍 '}
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={formSaving}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.9rem', marginTop: '8px' }}
              >
                {formSaving ? 'Saving Address...' : 'Save & Select Address'}
              </button>

            </form>
          </div>
        </div>
      )}

      <style>{`
        .btn-trash-hover:hover {
          color: var(--danger) !important;
          transform: scale(1.1);
        }
        .gateway-spinner {
          width: 70px;
          height: 70px;
          border: 4px solid rgba(0, 112, 243, 0.1);
          border-left: 4px solid #0070f3;
          border-radius: 50%;
          animation: spin-speed 0.8s infinite linear;
        }
        @keyframes spin-speed {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
