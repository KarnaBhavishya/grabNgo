// client/src/pages/ShopDetail.jsx
import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Star, Clock, MapPin, Upload, FileText, ShoppingBag, Plus, Minus, Check, Image as ImageIcon, MessageSquare, Send } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function ShopDetail({ navigate, shopId }) {
  const { location } = useLocation();
  const { token, user } = useAuth();
  const { cartItems, addToCart, updateQuantity, manualList, setManualList, uploadedImage, setUploadedImage } = useCart();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab state: 'catalog', 'list', or 'reviews'
  const [activeTab, setActiveTab] = useState('catalog');
  const [searchVal, setSearchVal] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);

  // Orders & Reviews state
  const [shopOrders, setShopOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewOrderId, setReviewOrderId] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Fetch Shop Info and Products
  useEffect(() => {
    const fetchShopAndProducts = async () => {
      setLoading(true);
      try {
        // 1. Fetch shops and filter to find this specific shop
        const queryLat = location?.lat || 12.9716;
        const queryLng = location?.lng || 77.5946;
        const shopsRes = await fetch(`${API_BASE}/shops?lat=${queryLat}&lng=${queryLng}`);
        
        if (shopsRes.ok) {
          const shopsData = await shopsRes.json();
          const foundShop = shopsData.find(s => s.id === parseInt(shopId));
          setShop(foundShop || null);
        }

        // 2. Fetch products
        const productsRes = await fetch(`${API_BASE}/products/shop/${shopId}`);
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }

        // 3. Fetch reviews
        const reviewsRes = await fetch(`${API_BASE}/shops/${shopId}/reviews`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData);
        }

        // 4. Fetch customer's previous orders from this shop (if logged in)
        if (token) {
          const ordersRes = await fetch(`${API_BASE}/orders/customer/shop/${shopId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            setShopOrders(ordersData);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load shop details.');
      } finally {
        setLoading(false);
      }
    };

    fetchShopAndProducts();
  }, [shopId, location, token]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrSuccess(false);
    setUploadedImage(URL.createObjectURL(file));

    // Simulate High-Fidelity OCR Receipt Scanner
    setTimeout(() => {
      setOcrLoading(false);
      setOcrSuccess(true);
      const simulatedOCRResult = `1. Farm Eggs Box - 1 Pack\n2. Organic Fresh Bananas - 2 kg\n3. Cold Pressed Coconut Oil - 1 Bottle`;
      setManualList(simulatedOCRResult);
    }, 2200);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!reviewOrderId) {
      setReviewError('Please select an order to review.');
      return;
    }

    setReviewSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/shops/${shopId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: parseInt(reviewOrderId),
          rating: reviewRating,
          comment: reviewComment
        })
      });

      const data = await response.json();
      if (response.ok) {
        setReviewSuccess(data.message || 'Review submitted!');
        setReviewComment('');
        setReviewRating(5);
        setReviewOrderId('');
        // Refresh reviews
        const reviewsRes = await fetch(`${API_BASE}/shops/${shopId}/reviews`);
        if (reviewsRes.ok) {
          setReviews(await reviewsRes.json());
        }
      } else {
        setReviewError(data.message || 'Failed to submit review.');
      }
    } catch (err) {
      console.error(err);
      setReviewError('Connection error.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchVal.toLowerCase()) ||
    p.description.toLowerCase().includes(searchVal.toLowerCase())
  );

  const getProductQtyInCart = (prodId) => {
    const found = cartItems.find(i => i.id === prodId);
    return found ? found.quantity : 0;
  };

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

  const completedOrders = shopOrders.filter(o => o.order_status === 'picked');

  if (loading) {
    return (
      <div className="content-wrapper flex-center" style={{ minHeight: 'calc(100vh - 180px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="shimmer-bg" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--slate-600)', fontWeight: 600 }}>Loading Store Catalogue...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="content-wrapper flex-center" style={{ minHeight: 'calc(100vh - 180px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>🏪</div>
          <p style={{ color: 'var(--slate-600)', fontWeight: 600, marginTop: '16px' }}>Shop not found or pending approval.</p>
          <button onClick={() => navigate('home')} className="btn btn-primary" style={{ marginTop: '16px' }}>Go Back Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper animate-fade-in" style={{ padding: '24px 16px' }}>
      
      {/* BACK NAVIGATION */}
      <button 
        onClick={() => navigate('home')} 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--slate-600)',
          fontWeight: 600,
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}
      >
        <ChevronLeft size={18} />
        Back to Stores
      </button>

      {/* 1. PREMIUM HEADER BANNER */}
      <section className="glass-panel" style={{
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        backgroundColor: 'white',
        marginBottom: '32px'
      }}>
        {/* Banner image or solid background color */}
        <div style={{ height: '220px', position: 'relative', overflow: 'hidden' }}>
          <img 
            src={shop.shop_photo} 
            alt={shop.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
            padding: '24px',
            color: 'white'
          }}>
            <span className="badge badge-open" style={{ marginBottom: '8px', border: 'none', backgroundColor: 'var(--primary)', color: 'white' }}>
              {shop.category_name}
            </span>
            <h2 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', color: 'white', fontWeight: 800 }}>
              {shop.name}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', marginTop: '4px' }}>
              {shop.description}
            </p>
          </div>
        </div>

        {/* Info stats bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          padding: '20px 24px',
          borderTop: '1px solid var(--slate-200)',
          fontSize: '0.9rem',
          color: 'var(--slate-600)',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Star size={16} fill="var(--warning)" color="var(--warning)" />
            <span style={{ color: 'var(--dark-slate)' }}>{parseFloat(shop.rating).toFixed(1)}</span>
            <span>({shop.total_reviews} reviews)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} color="var(--primary)" />
            <span>Open: {shop.open_time} - {shop.close_time}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} />
            <span>{shop.address}, {shop.city} ({shop.distance || 1.2} km away)</span>
          </div>
        </div>
      </section>

      {/* 2. ORDERING METHOD SELECTOR TABS */}
      <section style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          borderBottom: '2px solid var(--slate-200)',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {[
            { key: 'catalog', label: 'Store Catalogue' },
            { key: 'list', label: 'Quick Receipt / List' },
            { key: 'reviews', label: `Orders & Reviews (${reviews.length})` }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 6px',
                border: 'none',
                background: 'none',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: 'pointer',
                color: activeTab === tab.key ? 'var(--primary)' : 'var(--slate-400)',
                borderBottom: activeTab === tab.key ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'var(--transition-smooth)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: STORE CATALOGUE */}
        {activeTab === 'catalog' && (
          <div className="animate-fade-in">
            {/* Catalog search bar */}
            <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '24px' }}>
              <input
                id="product-search"
                name="product-search"
                type="text"
                placeholder="Search products in store..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingRight: '40px' }}
              />
            </div>

            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--slate-600)' }}>
                No products found matching your search.
              </div>
            ) : (
              <div className="grid-responsive">
                {filteredProducts.map((product) => {
                  const qty = getProductQtyInCart(product.id);
                  return (
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
                        style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                      />
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h4 style={{ fontSize: '1rem', color: 'var(--dark-slate)' }}>{product.name}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                          {product.description}
                        </p>
                        
                        <div className="flex-between" style={{ marginTop: '8px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                            ₹{parseFloat(product.price).toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-400)' }}>/ {product.unit}</span>
                          </span>

                          {/* Cart Quantity controls */}
                          {qty > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--primary-light)', padding: '4px 8px', borderRadius: '50px' }}>
                              <button onClick={() => updateQuantity(product.id, -1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex' }}><Minus size={14} /></button>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{qty}</span>
                              <button onClick={() => updateQuantity(product.id, 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex' }}><Plus size={14} /></button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => addToCart(product, shop)}
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '50px' }}
                              disabled={product.stock <= 0}
                            >
                              {product.stock <= 0 ? 'Out of Stock' : (
                                <>
                                  <Plus size={12} /> Add
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANUAL LIST / RECEIPT SCANNERS */}
        {activeTab === 'list' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
            
            {/* Input list text pad */}
            <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="custom-grocery-list">Write Handwritten List</label>
                <textarea
                  id="custom-grocery-list"
                  rows={8}
                  placeholder={"Type items here. E.g.:\n- 2 liters organic milk\n- 1 loaf of wheat bread\n- 1 kg organic sugar"}
                  value={manualList}
                  onChange={(e) => setManualList(e.target.value)}
                  className="input-field"
                  style={{ resize: 'none', lineHeight: 1.5, borderRadius: 'var(--radius-lg)' }}
                />
              </div>

              {manualList.trim() && (
                <div style={{
                  backgroundColor: 'hsl(152, 76%, 95%)',
                  borderLeft: '4px solid var(--secondary)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  color: 'var(--secondary)',
                  fontWeight: 500
                }}>
                  ✅ List saved in shopping packet. Ready to place custom list order!
                </div>
              )}
            </div>

            {/* Simulated Receipt OCR Scanner Card */}
            <div style={{ flex: '1 1 300px' }}>
              <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', borderStyle: 'dashed' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: ocrLoading ? 'var(--primary-light)' : 'var(--bg-main)',
                  color: ocrLoading ? 'var(--primary)' : 'var(--slate-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: ocrLoading ? 'pulse-scanning 1.5s infinite ease-in-out' : 'none'
                }}>
                  {ocrSuccess ? <Check size={28} color="var(--secondary)" /> : <Upload size={28} />}
                </div>

                <h4 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>
                  {ocrLoading ? 'Scanning Handwritten List...' : ocrSuccess ? 'Receipt Scan Successful!' : 'Snap Handwritten Receipt'}
                </h4>
                
                <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', maxWidth: '240px' }}>
                  {ocrLoading ? 'Converting your raw image lines to catalog order lists via OCR simulation...' : 'Upload a photo of your hand-written grocery pad list and let our system auto-fill it.'}
                </p>

                <div style={{ position: 'relative', marginTop: '8px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    id="ocr-file-input"
                    onChange={handleImageUpload}
                    style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
                    disabled={ocrLoading}
                  />
                  <label htmlFor="ocr-file-input" className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                    <ImageIcon size={16} /> Select Photo
                  </label>
                </div>

                {uploadedImage && (
                  <div style={{ width: '100%', maxWidth: '160px', height: '100px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--slate-200)', marginTop: '8px' }}>
                    <img src={uploadedImage} alt="Uploaded receipt preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS & REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
            
            {/* Previous Orders from this store */}
            <div style={{ flex: '1 1 400px' }}>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} color="var(--primary)" /> Your Previous Orders
              </h3>

              {!user ? (
                <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'white', textAlign: 'center', color: 'var(--slate-600)', border: '1px dashed var(--slate-200)' }}>
                  <p>Please log in to view your order history with this store.</p>
                </div>
              ) : shopOrders.length === 0 ? (
                <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'white', textAlign: 'center', color: 'var(--slate-600)', border: '1px dashed var(--slate-200)' }}>
                  <p>You haven't placed any orders at this store yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {shopOrders.map((order) => {
                    const statusStyle = getStatusColor(order.order_status);
                    return (
                      <div
                        key={order.id}
                        onClick={() => navigate('tracking', { orderId: order.id })}
                        className="glass-panel glass-panel-hover"
                        style={{
                          padding: '16px 20px',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          borderLeft: `3px solid ${statusStyle.color}`
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>{order.order_number}</span>
                            <span className="badge" style={{
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.color,
                              fontSize: '0.6rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              textTransform: 'uppercase'
                            }}>
                              {order.order_status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                            {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                          </div>
                        </div>
                        <span style={{ fontWeight: 800, color: 'var(--dark-slate)', fontSize: '1rem' }}>
                          ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div style={{ flex: '1 1 350px' }}>
              <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="var(--primary)" /> Customer Reviews ({reviews.length})
              </h3>

              {/* Write Review Form (only if user has completed orders) */}
              {user && completedOrders.length > 0 && (
                <div className="glass-panel" style={{ padding: '20px', backgroundColor: 'white', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--dark-slate)', marginBottom: '12px' }}>Write a Review</h4>

                  {reviewSuccess && (
                    <div className="animate-fade-in" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '12px', fontWeight: 600 }}>
                      ✓ {reviewSuccess}
                    </div>
                  )}
                  {reviewError && (
                    <div className="animate-fade-in" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '12px', fontWeight: 600 }}>
                      ⚠️ {reviewError}
                    </div>
                  )}

                  <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-600)', marginBottom: '4px', display: 'block' }}>Select Order</label>
                      <select
                        value={reviewOrderId}
                        onChange={(e) => setReviewOrderId(e.target.value)}
                        className="input-field"
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      >
                        <option value="">Choose an order...</option>
                        {completedOrders.map(o => (
                          <option key={o.id} value={o.id}>{o.order_number} – ₹{parseFloat(o.total_amount || 0).toFixed(2)}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-600)', marginBottom: '4px', display: 'block' }}>Rating</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '1.4rem',
                              color: star <= reviewRating ? 'var(--warning)' : 'var(--slate-200)',
                              transition: 'var(--transition-smooth)'
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <textarea
                        placeholder="Share your experience..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="input-field"
                        style={{ minHeight: '70px', padding: '10px', resize: 'vertical', fontSize: '0.85rem' }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={reviewSubmitting}
                      style={{ padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Send size={14} /> {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'white', textAlign: 'center', color: 'var(--slate-600)', border: '1px dashed var(--slate-200)' }}>
                  <p>No reviews yet for this store. Be the first!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reviews.map((review) => (
                    <div key={review.id} className="glass-panel" style={{ padding: '16px 20px', backgroundColor: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                            fontSize: '0.85rem'
                          }}>
                            {(review.customer_name || 'C').charAt(0)}
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--dark-slate)' }}>{review.customer_name}</strong>
                            <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                              {review.created_at ? new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={14} fill={s <= review.rating ? 'var(--warning)' : 'none'} color={s <= review.rating ? 'var(--warning)' : 'var(--slate-200)'} />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 3. PERSISTENT FLOATING CHECKOUT PANEL */}
      {(cartItems.length > 0 || manualList.trim()) && (
        <section className="glass-panel animate-slide-up" style={{
          position: 'sticky',
          bottom: '24px',
          backgroundColor: 'var(--dark-slate)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--glass-shadow-large)',
          zIndex: 90
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--slate-400)', letterSpacing: '0.05em' }}>Shopping Basket</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <ShoppingBag size={18} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {cartItems.length > 0 ? (
                  `₹${cartItems.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)} (${cartItems.reduce((acc, i) => acc + i.quantity, 0)} Items)`
                ) : (
                  'Custom Receipt Order'
                )}
              </span>
            </div>
          </div>

          <button onClick={() => navigate('cart')} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '0.9rem' }}>
            Proceed to Checkout
          </button>
        </section>
      )}

      <style>{`
        @keyframes pulse-scanning {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 107, 38, 0.4); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(255, 107, 38, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 107, 38, 0); }
        }
      `}</style>
    </div>
  );
}
