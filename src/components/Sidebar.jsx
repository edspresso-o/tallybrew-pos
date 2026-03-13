import React from 'react';
import { supabase } from '../supabaseClient';

export default function Sidebar({ currentView, setCurrentView, activeCashier }) {
  
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Error logging out: " + error.message);
    } else {
      window.location.reload();
    }
  };

  const menuItems = [
    { name: 'Dashboard', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
    { name: 'Menu', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg> },
    
    // NEW KITCHEN TAB
    { name: 'Kitchen', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> },
    
    { name: 'Inventory', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> },
    { name: 'Settings', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> }
  ];

  return (
    <div style={{ 
      width: '260px', 
      minWidth: '260px', 
      backgroundColor: '#0a0a0a', 
      color: '#fff', 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      boxSizing: 'border-box',
      margin: 0,
      padding: 0
    }}>
      
      <div style={{ padding: '40px 0 30px 0', textAlign: 'center', width: '100%', background: 'transparent' }}>
        <img 
          src={`${import.meta.env.BASE_URL}images/TallyBrewPosLogo.png`} 
          alt="TallyBrew Logo" 
          style={{ 
            width: '100%', 
            maxWidth: '160px', 
            height: 'auto', 
            display: 'block', 
            margin: '0 auto',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            userSelect: 'none',      
            WebkitUserDrag: 'none',  
            pointerEvents: 'none'    
          }} 
        />
      </div>

      <nav style={{ flex: 1, width: '100%' }}>
        {menuItems.map(item => {
          const isActive = currentView === item.name;
          return (
            <button 
              key={item.name}
              onClick={() => setCurrentView(item.name)}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start', 
                width: '100%',
                padding: '20px 35px', 
                backgroundColor: isActive ? '#C0662A' : 'transparent', 
                color: isActive ? '#fff' : '#9ca3af',
                border: 'none',
                borderRadius: '0', 
                fontSize: '18px',
                fontWeight: '500', 
                cursor: 'pointer',
                transition: 'all 0.2s ease', 
                textAlign: 'left',
                boxSizing: 'border-box',
                gap: '18px',
                transform: 'scale(1)'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </span>
              <span style={{ letterSpacing: '0.5px' }}>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '25px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
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
          onClick={handleSignOut} 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '14px', width: '100%', padding: '10px 5px', backgroundColor: 'transparent', color: '#9ca3af', border: 'none', fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: '500', boxSizing: 'border-box', borderRadius: '8px' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}