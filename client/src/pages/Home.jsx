// client/src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { Search, Star, Clock, MapPin, Grid, Heart, TrendingUp, SlidersHorizontal } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function Home({ navigate }) {
  const { user } = useAuth();
  const { location, isLocationSet } = useLocation();

  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  
  // Filtering & Sorting State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('Nearest');
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('gng_fav_shops');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Let's define default categories fallback which is robust
        setCategories([
          { id: 'All', name: 'All', icon: '✨' },
          { id: 1, name: 'Grocery', icon: '🛒' },
          { id: 2, name: 'Bakery', icon: '🍞' },
          { id: 3, name: 'Pharmacy', icon: '💊' },
          { id: 4, name: 'Vegetables', icon: '🥦' },
          { id: 5, name: 'Dairy', icon: '🥛' },
          { id: 6, name: 'Meat', icon: '🥩' },
          { id: 7, name: 'General', icon: '🏪' },
          { id: 8, name: 'Sweets', icon: '🍬' },
          { id: 9, name: 'Stationery', icon: '📝' },
          { id: 10, name: 'Electronics', icon: '🔌' },
          { id: 11, name: 'Pet Store', icon: '🐾' },
          { id: 12, name: 'Fruits', icon: '🍎' },
          { id: 13, name: 'Beverages', icon: '🥤' }
        ]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Shops whenever filters/coords change
  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        const queryLat = location?.lat || 12.9716;
        const queryLng = location?.lng || 77.5946;
        
        let url = `${API_BASE}/shops?lat=${queryLat}&lng=${queryLng}&sort=${sortOption}`;
        if (selectedCategory && selectedCategory !== 'All') {
          url += `&category=${selectedCategory}`;
        }
        if (searchTerm) {
          url += `&search=${encodeURIComponent(searchTerm)}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setShops(data);
        }
      } catch (error) {
        console.error('Error fetching shops:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [location, selectedCategory, searchTerm, sortOption]);

  const toggleFavorite = (shopId, e) => {
    e.stopPropagation(); // Avoid triggering shop card navigation
    let newFavs = [...favorites];
    if (newFavs.includes(shopId)) {
      newFavs = newFavs.filter(id => id !== shopId);
    } else {
      newFavs.push(shopId);
    }
    setFavorites(newFavs);
    localStorage.setItem('gng_fav_shops', JSON.stringify(newFavs));
  };

  return (
    <div className="content-wrapper animate-fade-in colorful-mesh-customer" style={{ padding: '24px 20px', borderRadius: 'var(--radius-xl)', minHeight: 'calc(100vh - 120px)', marginTop: '20px', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 8px 32px rgba(31, 38, 135, 0.05)' }}>
      
      {/* 1. HERO SEARCH / WELCOME SECTION */}
      <section style={{
        background: 'linear-gradient(135deg, hsl(14, 100%, 88%) 0%, hsl(200, 100%, 94%) 100%)',
        padding: '40px 32px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--primary-light)',
        marginBottom: '32px',
        display: 'flex',
        flexWrap: 'wrap-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--glass-shadow-large)'
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

        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 1 }}>
          <div>
            <span className="badge badge-open" style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              fontWeight: 800,
              fontSize: '0.75rem',
              marginBottom: '12px'
            }}>
              ✨ CUSTOMER DASHBOARD
            </span>
            <h2 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', color: 'var(--dark-slate)', lineHeight: 1.1, marginBottom: '8px' }}>
              Hello, <span style={{ color: 'var(--primary)' }}>{user ? user.name : 'Guest'}</span>!
            </h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem', maxWidth: '520px' }}>
              Browse active local merchants packed and ready in your active area: <strong style={{ color: 'var(--dark-slate)' }}>{location?.address}</strong>
            </p>
          </div>

          {/* Search Controls */}
          <div style={{ display: 'flex', gap: '10px', maxWidth: '480px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
              <input 
                id="shop-search"
                name="shop-search"
                type="text" 
                placeholder="Search stores or catalogs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
                style={{ width: '100%', paddingLeft: '48px', backgroundColor: 'white', border: '1px solid rgba(255,107,38,0.25)', boxShadow: 'var(--glass-shadow)' }}
              />
            </div>
          </div>
        </div>

        {/* Hero image card */}
        <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', zIndex: 1 }} className="animate-float">
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '360px',
            height: '200px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--glass-shadow-large)',
            border: '4px solid white'
          }}>
            <img 
              src="/customer_hero.png" 
              alt="Fresh grocery market" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </section>

      {/* 2. PREMIUM CATEGORIES SLIDER */}
      <section style={{ marginBottom: '32px' }}>
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Grid size={18} color="var(--primary)" />
            Shop by Category
          </h3>
        </div>
        
        {/* Horizontal scroll slider */}
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '10px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none'
        }} className="category-scroll-container">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className="glass-panel"
              style={{
                flex: '0 0 auto',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '50px',
                cursor: 'pointer',
                border: selectedCategory === cat.name ? '2px solid var(--primary)' : '1px solid var(--slate-200)',
                backgroundColor: selectedCategory === cat.name ? 'var(--primary-light)' : 'white',
                color: selectedCategory === cat.name ? 'var(--primary)' : 'var(--dark-slate)',
                fontWeight: 600,
                fontSize: '0.9rem',
                boxShadow: selectedCategory === cat.name ? '0 4px 12px rgba(255,107,38,0.15)' : 'none',
                transition: 'var(--transition-spring)'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. SHIRT FILTERS AND STORE COUNTER */}
      <section style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--slate-200)',
        paddingBottom: '16px'
      }}>
        <div style={{ fontSize: '0.95rem', color: 'var(--slate-600)', fontWeight: 600 }}>
          Showing <span style={{ color: 'var(--dark-slate)', fontWeight: 700 }}>{shops.length}</span> verified stores nearby
        </div>

        {/* Sorting Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={14} color="var(--slate-400)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '6px' }}>Sort By:</span>
          {['Nearest', 'Rating', 'Popular'].map((opt) => (
            <button
              key={opt}
              onClick={() => setSortOption(opt)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '50px',
                backgroundColor: sortOption === opt ? 'var(--dark-slate)' : 'transparent',
                color: sortOption === opt ? 'white' : 'var(--slate-600)',
                transition: 'var(--transition-smooth)'
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </section>

      {/* 4. SHOPS CATALOG GRID */}
      {loading ? (
        <div className="grid-responsive">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel shimmer-bg" style={{ height: '320px', borderRadius: 'var(--radius-lg)' }}></div>
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }} className="animate-scale-in">
          <div style={{ fontSize: '4.5rem', filter: 'grayscale(0.2)' }}>🏪</div>
          <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)' }}>No Local Stores Found</h3>
          <p style={{ color: 'var(--slate-600)', maxWidth: '400px', margin: '0 auto' }}>
            We couldn't find any active shops matching your filters in your coordinate radius. Try changing the categories or search parameters!
          </p>
          <button onClick={() => { setSelectedCategory('All'); setSearchTerm(''); }} className="btn btn-secondary" style={{ marginTop: '8px' }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid-responsive">
          {shops.map((shop) => (
            <div 
              key={shop.id}
              onClick={() => navigate('shop-detail', { shopId: shop.id })}
              className="glass-panel glass-panel-hover card-3d"
              style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                position: 'relative',
                backgroundColor: 'white'
              }}
            >
              {/* Shop Cover Image */}
              <div style={{ height: '160px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                <img 
                  src={shop.shop_photo} 
                  alt={shop.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                  className="shop-card-image"
                />
                
                {/* Floating Category Tag */}
                <span className="badge badge-open" style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  backgroundColor: 'white',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {shop.category_name}
                </span>

                {/* Favorite Heart Button */}
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(shop.id, e)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: favorites.includes(shop.id) ? 'var(--danger)' : 'var(--slate-400)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'var(--transition-spring)'
                  }}
                >
                  <Heart size={16} fill={favorites.includes(shop.id) ? 'var(--danger)' : 'none'} />
                </button>
              </div>

              {/* Shop Details */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                <div className="flex-between">
                  <h4 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', color: 'var(--dark-slate)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                    {shop.name}
                  </h4>
                  <span className="badge badge-rating" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '4px 8px' }}>
                    <Star size={12} fill="var(--warning)" color="var(--warning)" />
                    {parseFloat(shop.rating).toFixed(1)}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '40px', lineHeight: 1.4 }}>
                  {shop.description}
                </p>

                {/* Quick Info Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--slate-600)',
                  borderTop: '1px solid var(--slate-200)',
                  paddingTop: '12px',
                  marginTop: 'auto'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
                    <Clock size={14} />
                    <span>{shop.pickup_time || 20} mins prep</span>
                  </span>
                  
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} />
                    <span>{shop.distance || 1.2} km away</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .category-scroll-container::-webkit-scrollbar {
          display: none;
        }
        .glass-panel-hover:hover .shop-card-image {
          transform: scale(1.06);
        }
      `}</style>
    </div>
  );
}
