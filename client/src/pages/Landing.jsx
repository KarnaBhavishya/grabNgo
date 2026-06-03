// client/src/pages/Landing.jsx
import React from 'react';
import { ShoppingCart, PackageOpen, Zap, Store } from 'lucide-react';

export default function Landing({ navigate }) {
  return (
    <div className="animate-fade-in" style={{ overflow: 'hidden' }}>
      {/* HERO SECTION */}
      <section style={{
        background: 'linear-gradient(185deg, hsl(14, 100%, 94%) 0%, var(--bg-main) 100%)',
        padding: '80px 16px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="content-wrapper" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div 
            className="badge badge-open animate-float" 
            style={{ 
              alignSelf: 'center', 
              fontSize: '0.85rem', 
              padding: '8px 16px',
              backgroundColor: 'white',
              boxShadow: 'var(--glass-shadow)',
              color: 'var(--primary)',
              border: '1px solid var(--primary-light)'
            }}
          >
            ⚡ Zero Delivery Wait Times
          </div>

          <h1 style={{
            fontSize: '3.5rem',
            lineHeight: 1.1,
            color: 'var(--dark-slate)',
            fontFamily: 'var(--font-display)',
            fontWeight: 800
          }} className="animate-slide-up">
            Order Local. <br />
            <span style={{
              background: 'linear-gradient(135deg, var(--primary), hsl(4, 98%, 56%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Pickup Fast.</span>
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: 'var(--slate-600)',
            maxWidth: '600px',
            margin: '0 auto'
          }} className="animate-slide-up">
            Skip the high delivery markups and wait times. Order fresh groceries, bakery items, or medicines from your favorite neighborhood stores and grab them when they are ready!
          </p>

          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            marginTop: '16px'
          }} className="animate-scale-in">
            <button onClick={() => navigate('register')} className="btn btn-primary btn-3d btn-block" style={{ width: 'auto', padding: '16px 36px', fontSize: '1rem' }}>
              Get Started
            </button>
            <button onClick={() => navigate('login')} className="btn btn-secondary" style={{ padding: '16px 36px', fontSize: '1rem' }}>
              Sign In
            </button>
          </div>
        </div>

        {/* Floating 3D Graphics */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '5%',
          fontSize: '4rem',
          opacity: 0.15,
          userSelect: 'none'
        }} className="animate-float-3d">
          🥦
        </div>
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '8%',
          fontSize: '4.5rem',
          opacity: 0.15,
          userSelect: 'none'
        }} className="animate-float-3d">
          🍞
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section style={{ padding: '80px 16px' }}>
        <div className="content-wrapper">
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.2rem',
            marginBottom: '48px',
            fontFamily: 'var(--font-display)'
          }}>
            How it <span style={{ color: 'var(--primary)' }}>Works</span>
          </h2>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '32px',
            justifyContent: 'center'
          }}>
            {/* Step 1 */}
            <div className="glass-panel card-3d" style={{
              flex: '1 1 300px',
              maxWidth: '360px',
              padding: '32px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShoppingCart size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>1. Order Online</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--slate-600)' }}>
                Browse local grocery lists, search specific items, or simply upload a picture of your handwritten shopping receipt list.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-panel card-3d" style={{
              flex: '1 1 300px',
              maxWidth: '360px',
              padding: '32px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                backgroundColor: 'hsl(152, 76%, 94%)',
                color: 'var(--secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PackageOpen size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>2. Shop Packs</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--slate-600)' }}>
                The merchant receives your cart, accepts it in real-time, packs the items fresh, and seals them safely for transit.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-panel card-3d" style={{
              flex: '1 1 300px',
              maxWidth: '360px',
              padding: '32px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                backgroundColor: 'var(--warning-light)',
                color: 'var(--warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>3. You Grab & Go</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--slate-600)' }}>
                Walk into the store, check the tracking QR/code on your phone, pick up your sealed package, and continue your day!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MERCHANT CALL TO ACTION */}
      <section style={{
        background: 'var(--dark-slate)',
        color: 'white',
        padding: '60px 16px'
      }}>
        <div className="content-wrapper" style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '32px'
        }}>
          <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', color: 'white' }}>
              Are you a local shop owner?
            </h2>
            <p style={{ color: 'var(--slate-400)', fontSize: '1.05rem', maxWidth: '600px' }}>
              Onboard your shop to GrabNGo, receive instant order listings, manage your products catalog, handle real-time cash or online transactions, and multiply your daily customer base!
            </p>
          </div>
          <button 
            onClick={() => navigate('register', { defaultRole: 'shopowner' })} 
            className="btn btn-primary btn-3d" 
            style={{ 
              padding: '16px 36px', 
              fontSize: '1rem',
              backgroundColor: 'white',
              color: 'var(--dark-slate)',
              border: 'none',
              boxShadow: 'none'
            }}
          >
            <Store size={18} /> Register Your Shop
          </button>
        </div>
      </section>
    </div>
  );
}

