import React from 'react';

export default function GlobalAlert({ appAlert, closeAlert }) {
  if (!appAlert.isOpen) return null;

  return (
    <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10005, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#E6D0A9', borderRadius: '32px', padding: '40px 35px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', animation: 'popIn 0.3s' }}>
        
        <div style={{ width: '80px', height: '80px', backgroundColor: '#FDFBF7', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #3B2213', boxShadow: '0 8px 16px rgba(59,34,19,0.1)' }}>
          {appAlert.type === 'error' ? (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          )}
        </div>

        <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 10px', color: '#3B2213', letterSpacing: '-0.5px' }}>
          {appAlert.type === 'error' ? 'Action Denied' : 'System Message'}
        </h2>
        
        <p style={{ color: '#3B2213', fontSize: '15px', marginBottom: '30px', fontWeight: '600', opacity: 0.8, lineHeight: '1.4' }}>
          {appAlert.message}
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          {appAlert.type === 'confirm' && (
            <button onClick={closeAlert} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#FDFBF7', color: '#3B2213', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
          )}
          <button 
            onClick={() => {
              if (appAlert.onConfirm) appAlert.onConfirm();
              closeAlert();
            }} 
            style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#3B2213', color: '#FDFBF7', fontWeight: '900', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,34,19,0.3)' }}
          >
            {appAlert.type === 'error' ? 'Dismiss' : 'Okay'}
          </button>
        </div>

      </div>
    </div>
  );
}