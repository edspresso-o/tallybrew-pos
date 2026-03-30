import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function SettingsShift({ activeCashier, activeShift, onUpdateShift, onPrepareEndShift }) {
  const [showSkimModal, setShowSkimModal] = useState(false);
  const [skimAmount, setSkimAmount] = useState('');
  const [isSkimming, setIsSkimming] = useState(false);

  const formatMoney = (amount) => `₱ ${Number(amount).toFixed(2)}`;
  const formattedStartTime = activeShift 
    ? new Date(activeShift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : 'Not Clocked In';

  const handleRecordSkim = async () => {
    const dropAmount = parseFloat(skimAmount);
    if (!dropAmount || dropAmount <= 0) return;

    setIsSkimming(true);
    try {
      const currentDrops = Number(activeShift.cash_drops || 0);
      const newTotalDrops = currentDrops + dropAmount;

      const { error } = await supabase.from('shifts').update({ cash_drops: newTotalDrops }).eq('id', activeShift.id);
      if (error) throw error;

      if (onUpdateShift) onUpdateShift({ ...activeShift, cash_drops: newTotalDrops });
      setShowSkimModal(false);
      setSkimAmount('');
    } catch (err) {
      alert("Error recording cash drop: " + err.message);
    }
    setIsSkimming(false);
  };

  return (
    <>
      {/* RESPONSIVE CSS INJECTIONS */}
      <style>{`
        .hide-arrows::-webkit-outer-spin-button, .hide-arrows::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .hide-arrows { -moz-appearance: textfield; }
        
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        
        .action-btn { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .action-btn:hover:not(:disabled) { transform: translateY(-2px); }
        .action-btn:active:not(:disabled) { transform: translateY(0); }
        
        .skim-input:focus { border-color: #B56124 !important; box-shadow: 0 0 0 4px rgba(181, 97, 36, 0.15) !important; }

        /* MOBILE RESPONSIVE RULES */
        @media screen and (max-width: 600px) {
          .shift-card { padding: 24px !important; }
          .skim-modal { width: 92% !important; padding: 30px 24px !important; }
          .skim-input { font-size: 32px !important; padding: 12px !important; }
          .modal-btn-container { flex-direction: column !important; gap: 10px !important; }
          .info-row { flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; }
        }
      `}</style>

      {/* CASH DROP (SKIM) MODAL */}
      {showSkimModal && (
        <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, backgroundColor: 'rgba(59, 34, 19, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          
          <div className="skim-modal" style={{ width: '100%', maxWidth: '420px', borderRadius: '32px', padding: '40px 35px', textAlign: 'center', backgroundColor: '#FDFBF7', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', border: '1px solid #E6D0A9', animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxSizing: 'border-box' }}>
            
            <div style={{ width: '70px', height: '70px', backgroundColor: '#fff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid #E6D0A9', boxShadow: '0 8px 16px rgba(181,97,36,0.1)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            
            <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 8px', color: '#3B2213', letterSpacing: '-0.5px' }}>Record Cash Drop</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '30px', fontWeight: '500', lineHeight: '1.5' }}>
              Secure excess cash from the drawer. This amount will be deducted from your expected end-of-shift total.
            </p>

            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#B56124', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Amount to Drop (₱)</label>
              <input 
                className="hide-arrows skim-input" 
                type="number" 
                value={skimAmount} 
                onChange={(e) => setSkimAmount(e.target.value)} 
                placeholder="0.00" 
                style={{ width: '100%', backgroundColor: '#fff', border: '2px solid #E6D0A9', borderRadius: '16px', outline: 'none', fontSize: '40px', fontWeight: '900', color: '#3B2213', padding: '15px', textAlign: 'center', transition: 'all 0.2s', boxSizing: 'border-box' }} 
                autoFocus 
              />
            </div>

            <div className="modal-btn-container" style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="action-btn"
                onClick={() => {setShowSkimModal(false); setSkimAmount('');}} 
                style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid #e5e7eb', backgroundColor: '#fff', color: '#4b5563', fontWeight: '800', fontSize: '15px', cursor: 'pointer', width: '100%' }}
              >
                Cancel
              </button>
              <button 
                className="action-btn"
                onClick={handleRecordSkim} 
                disabled={isSkimming || !skimAmount} 
                style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#B56124', color: '#fff', fontWeight: '900', fontSize: '15px', cursor: (!skimAmount || isSkimming) ? 'not-allowed' : 'pointer', opacity: (!skimAmount || isSkimming) ? 0.6 : 1, boxShadow: '0 8px 15px rgba(181, 97, 36, 0.25)', width: '100%' }}
              >
                {isSkimming ? 'Saving...' : 'Confirm Drop'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MAIN DASHBOARD CARD */}
      <div className="shift-card" style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(59, 34, 19, 0.04)', border: '1px solid #f3f4f6', maxWidth: '500px', width: '100%', boxSizing: 'border-box', animation: 'fadeIn 0.3s ease-out', textAlign: 'left' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#FDFBF7', border: '1px solid #E6D0A9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#3B2213', margin: 0, letterSpacing: '-0.5px' }}>Active Register</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
          
          {/* User Row */}
          <div className="info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#FDFBF7', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span style={{ color: '#6b7280', fontWeight: '700', fontSize: '14px' }}>Cashier on Duty</span>
            </div>
            <span style={{ color: '#3B2213', fontWeight: '900', fontSize: '15px' }}>{activeCashier?.username || 'Unknown'}</span>
          </div>
          
          {/* Clock In Row */}
          <div className="info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#FDFBF7', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span style={{ color: '#6b7280', fontWeight: '700', fontSize: '14px' }}>Clocked In At</span>
            </div>
            <span style={{ color: '#3B2213', fontWeight: '800', fontSize: '15px' }}>{formattedStartTime}</span>
          </div>
          
          {/* Float Row */}
          <div className="info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#fff', borderRadius: '16px', border: '2px solid #E6D0A9', boxShadow: '0 4px 10px rgba(230, 208, 169, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle></svg>
              <span style={{ color: '#B56124', fontWeight: '800', fontSize: '14px' }}>Starting Float</span>
            </div>
            <span style={{ color: '#B56124', fontWeight: '900', fontSize: '16px' }}>{formatMoney(activeShift?.starting_cash || 0)}</span>
          </div>

          {/* Drops Row */}
          {Number(activeShift?.cash_drops || 0) > 0 && (
            <div className="info-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#fef2f2', borderRadius: '16px', border: '1px dashed #fca5a5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                <span style={{ color: '#dc2626', fontWeight: '800', fontSize: '14px' }}>Cash Dropped</span>
              </div>
              <span style={{ color: '#dc2626', fontWeight: '900', fontSize: '15px' }}>- {formatMoney(activeShift?.cash_drops)}</span>
            </div>
          )}

        </div>

        {/* ACTIONS */}
        <div style={{ borderTop: '2px dashed #e5e7eb', paddingTop: '25px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <button 
            className="action-btn"
            onClick={() => setShowSkimModal(true)}
            disabled={!activeShift}
            style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #E6D0A9', background: '#FDFBF7', color: '#B56124', fontWeight: '900', fontSize: '14px', cursor: !activeShift ? 'not-allowed' : 'pointer', opacity: !activeShift ? 0.5 : 1 }}
          >
            Record Cash Drop (Skim)
          </button>
          
          <button 
            className="action-btn"
            onClick={onPrepareEndShift}
            disabled={!activeShift}
            style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: '#3B2213', color: '#fff', fontWeight: '900', fontSize: '15px', cursor: !activeShift ? 'not-allowed' : 'pointer', opacity: !activeShift ? 0.5 : 1, boxShadow: '0 8px 20px rgba(59, 34, 19, 0.2)' }}
          >
            Close Register & End Shift
          </button>

        </div>
      </div>
    </>
  );
}