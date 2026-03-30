import React, { useState } from 'react';

export default function ManagerAuthModal({ 
  showManagerAuth, 
  setShowManagerAuth, 
  onSuccess, // Fixed: Transactions.jsx sends this
  currentBranchId 
}) {
  // NEW: Keep the PIN state inside the modal so it doesn't crash the parent
  const [pin, setPin] = useState("");

  if (!showManagerAuth) return null;

  const handleAuthorize = () => {
    // Here you would normally verify the PIN with Supabase
    // For now, we call onSuccess to let the transaction through
    if (typeof onSuccess === 'function') {
      onSuccess({ username: 'Manager', branch: currentBranchId });
      setPin(""); // Clear for next time
      setShowManagerAuth(false);
    }
  };

  const handleCancel = () => {
    setPin("");
    setShowManagerAuth(false);
  };

  return (
    <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10005, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#E6D0A9', borderRadius: '32px', padding: '40px 35px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)' }}>
        
        <div style={{ width: '80px', height: '80px', backgroundColor: '#FDFBF7', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #3B2213' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
        </div>

        <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 10px', color: '#3B2213' }}>Manager Approval</h2>
        <p style={{ color: '#3B2213', fontSize: '14px', marginBottom: '30px', fontWeight: '600', opacity: 0.8 }}>Enter your 6-Digit PIN to void this sale.</p>
        
        <input 
          type="password" 
          placeholder="• • • • • •" 
          maxLength={6} 
          value={pin} // Fixed: Using internal pin state
          onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))} 
          style={{ width: '100%', height: '70px', textAlign: 'center', fontSize: '40px', letterSpacing: '12px', fontWeight: '900', color: '#3B2213', borderRadius: '16px', border: '2px solid #3B2213', marginBottom: '30px', outline: 'none', backgroundColor: '#FDFBF7', boxSizing: 'border-box' }} 
          autoFocus 
        />

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleCancel} 
            style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#FDFBF7', color: '#3B2213', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          
          <button 
            onClick={handleAuthorize} 
            disabled={pin.length !== 6} // Fixed: This was where the crash happened
            style={{ 
              flex: 1, padding: '16px', borderRadius: '16px', border: 'none', 
              backgroundColor: '#B56124', color: '#FDFBF7', fontWeight: '900', 
              fontSize: '15px', 
              cursor: pin.length !== 6 ? 'not-allowed' : 'pointer', 
              opacity: pin.length !== 6 ? 0.6 : 1 
            }}
          >
            Authorize
          </button>
        </div>
      </div>
    </div>
  );
}