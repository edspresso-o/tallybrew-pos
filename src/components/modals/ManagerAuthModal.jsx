import React from 'react';

export default function ManagerAuthModal({ 
  showManagerAuth, setShowManagerAuth, managerPinInput, 
  setManagerPinInput, executeManagerOverride, setPendingAction 
}) {
  if (!showManagerAuth) return null;

  return (
    <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10005, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#E6D0A9', borderRadius: '32px', padding: '40px 35px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', animation: 'popIn 0.3s' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#FDFBF7', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #3B2213', boxShadow: '0 8px 16px rgba(59,34,19,0.1)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 10px', color: '#3B2213', letterSpacing: '-0.5px' }}>Manager Approval</h2>
        <p style={{ color: '#3B2213', fontSize: '14px', marginBottom: '30px', fontWeight: '600', opacity: 0.8, lineHeight: '1.4' }}>This action requires manager privileges. Please enter your 6-Digit PIN.</p>
        <input type="password" placeholder="• • • • • •" maxLength={6} value={managerPinInput} onChange={(e) => setManagerPinInput(e.target.value.replace(/[^0-9]/g, ''))} style={{ width: '100%', height: '70px', textAlign: 'center', fontSize: '40px', letterSpacing: '12px', fontWeight: '900', color: '#3B2213', borderRadius: '16px', border: '2px solid #3B2213', marginBottom: '30px', outline: 'none', backgroundColor: '#FDFBF7', boxSizing: 'border-box' }} autoFocus />
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => {setShowManagerAuth(false); setPendingAction(null); setManagerPinInput("");}} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#FDFBF7', color: '#3B2213', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={executeManagerOverride} disabled={managerPinInput.length !== 6} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#B56124', color: '#FDFBF7', fontWeight: '900', fontSize: '15px', cursor: managerPinInput.length !== 6 ? 'not-allowed' : 'pointer', opacity: managerPinInput.length !== 6 ? 0.6 : 1, boxShadow: '0 4px 12px rgba(181, 97, 36, 0.3)' }}>Authorize</button>
        </div>
      </div>
    </div>
  );
}