import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function SettingsSecurity({ activeCashier }) {
  const [newPin, setNewPin] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);

  const handleUpdatePin = async (e) => {
    e.preventDefault();
    if (newPin.length !== 6) {
      setIsError(true);
      setStatusMsg("PIN must be exactly 6 digits.");
      return;
    }
    try {
      const { error } = await supabase.from('profiles').update({ pin: newPin }).eq('username', activeCashier.username);
      if (error) throw error;
      setIsError(false);
      setStatusMsg("Success! Your personal PIN has been updated.");
      setNewPin('');
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      setIsError(true);
      setStatusMsg("Database Error: Could not update PIN.");
    }
  };

  return (
    <>
      {/* CSS INJECTIONS FOR RESPONSIVENESS AND TACTILE UI */}
      <style>{`
        .action-btn { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(59, 34, 19, 0.2) !important; }
        .action-btn:active:not(:disabled) { transform: translateY(0); }
        
        .premium-input { transition: all 0.2s ease; }
        .premium-input:focus { border-color: #B56124 !important; box-shadow: 0 0 0 4px rgba(181, 97, 36, 0.15) !important; }

        /* MOBILE RESPONSIVE RULES */
        @media screen and (max-width: 600px) {
          .security-card { padding: 24px !important; }
          .pin-input { font-size: 20px !important; letter-spacing: 4px !important; padding: 14px !important; }
          .header-text { font-size: 20px !important; }
        }
      `}</style>

      <div className="security-card" style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(59, 34, 19, 0.04)', border: '1px solid #f3f4f6', maxWidth: '500px', animation: 'fadeIn 0.3s ease-out', textAlign: 'left', width: '100%', boxSizing: 'border-box' }}>
        
        {/* BRANDED HEADER WITH ICON */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#FDFBF7', border: '1px solid #E6D0A9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h2 className="header-text" style={{ fontSize: '22px', fontWeight: '900', color: '#3B2213', margin: 0, letterSpacing: '-0.5px' }}>
            Update Personal PIN
          </h2>
        </div>

        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '25px', fontWeight: '500', lineHeight: '1.5', paddingLeft: '52px' }}>
          This 6-digit PIN is used to quickly unlock the screen and authorize actions. Do not share it.
        </p>

        {statusMsg && (
          <div style={{ background: isError ? '#fef2f2' : '#ecfdf5', color: isError ? '#dc2626' : '#059669', padding: '14px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', marginBottom: '20px', border: `1px solid ${isError ? '#fecaca' : '#a7f3d0'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isError ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            )}
            {statusMsg}
          </div>
        )}

        <form onSubmit={handleUpdatePin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#B56124', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              New 6-Digit PIN
            </label>
            <input 
              type="password" 
              maxLength={6} 
              placeholder="• • • • • •" 
              value={newPin} 
              onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))} 
              className="premium-input pin-input"
              style={{ width: '100%', padding: '18px', boxSizing: 'border-box', background: '#FDFBF7', border: '2px solid #E6D0A9', borderRadius: '16px', fontSize: '24px', fontWeight: '900', letterSpacing: '6px', color: '#3B2213', outline: 'none', textAlign: 'center' }} 
            />
          </div>
          
          <button 
            type="submit" 
            className="action-btn"
            disabled={newPin.length !== 6} 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '18px', borderRadius: '16px', border: 'none', background: '#3B2213', color: '#fff', fontWeight: '900', fontSize: '15px', cursor: newPin.length !== 6 ? 'not-allowed' : 'pointer', opacity: newPin.length !== 6 ? 0.6 : 1, boxShadow: '0 8px 15px rgba(59, 34, 19, 0.2)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Save New PIN
          </button>
        </form>
      </div>
    </>
  );
}