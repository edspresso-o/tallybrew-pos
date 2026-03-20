import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Sidebar({ currentView, setCurrentView, activeCashier, activeShift, isMobileNavOpen, setIsMobileNavOpen }) {
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Error logging out: " + error.message);
    } else {
      window.location.reload();
    }
  };

  const attemptSignOut = () => {
    // If a shift is open AND the user is just a regular cashier, block them
    if (activeShift && activeCashier?.role !== 'manager' && activeCashier?.role !== 'admin') {
      setShowOverrideModal(true);
    } else {
      // Managers, Admins, or cashiers with NO active shift can sign out normally
      handleSignOut();
    }
  };

  const menuItems = [
    { name: 'Dashboard', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
    { name: 'Menu', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg> },
    { name: 'Kitchen', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> },
    
    // --- NEW: TRANSACTIONS TAB ADDED HERE ---
    { name: 'Transactions', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
    
    { name: 'Inventory', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> },
    { name: 'Settings', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> }
  ];

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        /* DEFAULT DESKTOP STYLES */
        .sidebar-wrapper {
          width: 260px;
          min-width: 260px;
          background-color: #0a0a0a;
          color: #fff;
          display: flex;
          flex-direction: column;
          height: 100%;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1001;
        }
        
        .mobile-close-btn {
          display: none;
        }

        /* FIX FOR APP.JSX ELEMENTS */
        .mobile-nav-toggle {
          display: none !important; /* hidden on desktop */
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 999;
          background: #3B2213;
          color: #E6D0A9;
          border: none;
          border-radius: 12px;
          padding: 12px;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(59,34,19,0.2);
        }

        .sidebar-overlay {
           display: none;
        }

        /* MOBILE RESPONSIVE STYLES */
        @media (max-width: 850px) {
          .mobile-nav-toggle {
             display: flex !important;
             align-items: center;
             justify-content: center;
          }
          
          .sidebar-wrapper {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            transform: translateX(-100%);
            box-shadow: 10px 0 25px rgba(0,0,0,0.5);
          }
          
          .sidebar-wrapper.mobile-open {
            transform: translateX(0);
          }

          .sidebar-overlay.open {
             display: block;
             position: fixed;
             top: 0; left: 0; right: 0; bottom: 0;
             background: rgba(59, 34, 19, 0.6);
             backdrop-filter: blur(3px);
             z-index: 1000;
             animation: fadeIn 0.3s ease;
          }

          .mobile-close-btn {
             display: flex;
             align-items: center;
             justify-content: center;
             position: absolute;
             top: 20px;
             right: 20px;
             background: rgba(255,255,255,0.1);
             border: none;
             border-radius: 50%;
             width: 36px;
             height: 36px;
             color: #fff;
             font-size: 20px;
             cursor: pointer;
             z-index: 1002;
          }
        }
      `}</style>

      {/* SHIFT STILL ACTIVE WARNING POPUP */}
      {showOverrideModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10005, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '380px', borderRadius: '32px', padding: '35px', backgroundColor: '#E6D0A9', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', animation: 'fadeIn 0.3s ease-out', textAlign: 'center' }}>
            
            <div style={{ width: '70px', height: '70px', margin: '0 auto 20px', borderRadius: '20px', background: '#FDFBF7', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #3B2213', boxShadow: '0 8px 16px rgba(59,34,19,0.1)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 10px 0', color: '#3B2213', letterSpacing: '-0.5px' }}>Shift Still Active</h2>
            <p style={{ margin: '0 0 25px 0', fontSize: '15px', fontWeight: '600', color: '#3B2213', lineHeight: '1.4', opacity: 0.85 }}>
              You cannot sign out while your register is open. Please go to <strong>Settings</strong> to close your shift first.
            </p>

            <button 
              onClick={() => setShowOverrideModal(false)}
              style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#3B2213', color: '#FDFBF7', fontWeight: '900', fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 15px rgba(59,34,19,0.2)', transition: 'transform 0.1s' }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Understood
            </button>
            
          </div>
        </div>
      )}

      {/* SIDEBAR CONTENT */}
      <div className={`sidebar-wrapper ${isMobileNavOpen ? 'mobile-open' : ''}`}>
        
        <button className="mobile-close-btn" onClick={() => setIsMobileNavOpen && setIsMobileNavOpen(false)}>
          &times;
        </button>

        <div style={{ padding: '40px 0 30px 0', textAlign: 'center', width: '100%', background: 'transparent' }}>
          <img 
            src={`${import.meta.env.BASE_URL}images/TallyBrewPosLogo.png`} 
            alt="TallyBrew Logo" 
            style={{ width: '100%', maxWidth: '160px', height: 'auto', display: 'block', margin: '0 auto', border: 'none', outline: 'none', background: 'transparent', userSelect: 'none', WebkitUserDrag: 'none', pointerEvents: 'none' }} 
          />
        </div>

        <nav style={{ flex: 1, width: '100%' }}>
          {menuItems.map(item => {
            const isActive = currentView === item.name;
            return (
              <button 
                key={item.name}
                onClick={() => {
                  setCurrentView(item.name);
                  // Close sidebar automatically on mobile after navigating
                  if (setIsMobileNavOpen) setIsMobileNavOpen(false); 
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%', padding: '20px 35px', backgroundColor: isActive ? '#C0662A' : 'transparent', color: isActive ? '#fff' : '#9ca3af', border: 'none', borderRadius: '0', fontSize: '18px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left', boxSizing: 'border-box', gap: '18px', transform: 'scale(1)' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                <span style={{ letterSpacing: '0.5px' }}>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* LIFTED BOTTOM SECTION: Increased bottom padding to 40px */}
        <div style={{ padding: '25px 25px 40px 25px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '15px', marginBottom: '25px', paddingLeft: '5px' }}>
            <div style={{ width: '45px', height: '45px', backgroundColor: '#C0662A', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800' }}>
              {activeCashier?.username ? activeCashier.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Active User</span>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#fff' }}>{activeCashier?.username || 'Guest'}</span>
            </div>
          </div>
          
          <button 
            onClick={attemptSignOut}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '14px', width: '100%', padding: '10px 5px', backgroundColor: 'transparent', color: '#9ca3af', border: 'none', fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: '500', boxSizing: 'border-box', borderRadius: '8px' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}