import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function CashierLock({ onUnlock }) {
  const [cashiers, setCashiers] = useState([]);
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [pinEntry, setPinEntry] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const fetchCashiers = async () => {
      const { data } = await supabase.from('profiles').select('*').order('username');
      if (data) setCashiers(data);
    };
    fetchCashiers();
  }, []);

  const getTargetPin = () => {
    if (!selectedCashier) return "123456";
    return String(selectedCashier.pin || "123456").trim();
  };

  const handlePinPress = (num) => {
    const targetPin = getTargetPin();

    if (pinEntry.length < targetPin.length) {
      const newPin = pinEntry + num;
      setPinEntry(newPin);
      setError('');

      if (newPin.length === targetPin.length) {
        if (newPin === targetPin) {
          onUnlock(selectedCashier);
        } else {
          setIsShaking(true);
          setError('Incorrect PIN. Try again.');
          setTimeout(() => {
            setIsShaking(false);
            setPinEntry('');
          }, 400); 
        }
      }
    }
  };

  const renderLogo = () => {
    if (!logoError) {
      return (
        <img 
  src={`${import.meta.env.BASE_URL}images/TallyBrewPosLogo.png`} 
  alt="TallyBrew Logo" 
  style={{ 
    maxWidth: '400px', 
    width: '100%', 
    height: 'auto', 
    marginBottom: '-50', /* Changed from -80px to push the box down a bit */
    marginTop: '0vh',
    position: 'relative',
    zIndex: 1
  }} 
/>
      );
    }
    return (
      <h1 style={{ fontFamily: "'Lobster', cursive, sans-serif", fontSize: '48px', color: '#3B2213', margin: '0' }}>
        TallyBrew
      </h1>
    );
  };

  if (cashiers.length === 0) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDFBF7' }}>
      <h2 style={{ color: '#B56124', fontFamily: "'Inter', sans-serif" }}>Loading Terminal...</h2>
    </div>
  );

  return (
    // UPDATED: Removed "justifyContent: center" to stop the weird gaps, and added specific padding to top
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minHeight: '100vh', backgroundColor: '#FDFBF7', fontFamily: "'Inter', sans-serif", paddingTop: '50px', paddingBottom: '20px', overflowY: 'auto' }}>
      
      {/* --- UI ANIMATIONS & STYLES --- */}
      <style>{`
        @keyframes lockShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .shake-animation { animation: lockShake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        
        .user-circle { transition: all 0.2s ease; cursor: pointer; border: 3px solid transparent; }
        .user-circle:hover { transform: translateY(-5px); border-color: #B56124; box-shadow: 0 10px 20px rgba(59,34,19,0.15); }
        
        .numpad-btn { transition: all 0.1s ease-out; cursor: pointer; }
        .numpad-btn:hover { filter: brightness(0.95); transform: scale(1.05); }
        .numpad-btn:active { transform: scale(0.95); }
        
        .bottom-link { transition: all 0.2s ease; cursor: pointer; }
        .bottom-link:hover { opacity: 0.6; }
      `}</style>

      {/* 1. TALLYBREW LOGO - Fixed to the top with a controlled margin */}
      <div style={{ animation: 'fadeIn 0.4s ease-out', marginBottom: '35px' }}>
        {renderLogo()}
      </div>

      {/* 2. BEIGE LOCK CARD */}
      <div className={isShaking ? 'shake-animation' : ''} style={{ background: '#E6D0A9', borderRadius: '32px', padding: '30px 25px', width: '100%', maxWidth: '380px', boxShadow: '0 15px 35px rgba(59, 34, 19, 0.1)', animation: 'fadeIn 0.5s ease-out' }}>
        
        {/* --- VIEW 1: SELECT USER --- */}
        {!selectedCashier ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <h2 style={{ color: '#B56124', fontSize: '24px', fontWeight: '900', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>Select User</h2>
              <p style={{ color: '#3B2213', fontSize: '13px', margin: 0, fontWeight: '600', opacity: 0.8 }}>Tap your profile to sign in.</p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
              {cashiers.map(c => (
                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '85px' }}>
                  <div 
                    className="user-circle" 
                    onClick={() => setSelectedCashier(c)}
                    style={{ width: '65px', height: '65px', borderRadius: '50%', background: c.role === 'manager' || c.role === 'admin' ? '#B56124' : '#3B2213', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '900', boxShadow: '0 6px 12px rgba(59, 34, 19, 0.1)' }}
                  >
                    {c.username.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ color: '#3B2213', fontWeight: '800', fontSize: '13px', marginTop: '8px' }}>{c.username}</div>
                  <div style={{ color: '#B56124', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{c.role}</div>
                </div>
              ))}
            </div>
          </>
        ) : (

          /* --- VIEW 2: PIN ENTRY --- */
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <div style={{ width: '50px', height: '50px', margin: '0 auto 10px', borderRadius: '50%', background: selectedCashier.role === 'manager' || selectedCashier.role === 'admin' ? '#B56124' : '#3B2213', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '900', boxShadow: '0 8px 15px rgba(59,34,19,0.2)' }}>
                {selectedCashier.username.charAt(0).toUpperCase()}
              </div>
              <h2 style={{ color: '#B56124', fontSize: '20px', fontWeight: '900', margin: '0 0 2px 0', letterSpacing: '-0.5px' }}>{selectedCashier.username}</h2>
              <p style={{ color: error ? '#dc2626' : '#3B2213', fontSize: '12px', fontWeight: '600', margin: 0, opacity: error ? 1 : 0.8 }}>
                {error || 'Enter your PIN'}
              </p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '25px' }}>
              {[...Array(getTargetPin().length)].map((_, i) => (
                <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', transition: 'all 0.2s', background: i < pinEntry.length ? '#3B2213' : '#F5E8D2', transform: i < pinEntry.length ? 'scale(1.15)' : 'scale(1)', boxShadow: i < pinEntry.length ? '0 2px 5px rgba(59,34,19,0.3)' : 'inset 0 2px 4px rgba(59,34,19,0.1)' }}></div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', justifyItems: 'center', maxWidth: '220px', margin: '0 auto' }}>
              {['1','2','3','4','5','6','7','8','9'].map(num => (
                <button key={num} className="numpad-btn" onClick={() => handlePinPress(num)} style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#F5E8D2', border: 'none', fontSize: '22px', fontWeight: '800', color: '#3B2213', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(59,34,19,0.1)' }}>
                  {num}
                </button>
              ))}
              <button className="numpad-btn" onClick={() => {setPinEntry(''); setError('');}} style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#FDFBF7', border: 'none', fontSize: '20px', fontWeight: '800', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(59,34,19,0.1)' }}>
                C
              </button>
              <button className="numpad-btn" onClick={() => handlePinPress('0')} style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#F5E8D2', border: 'none', fontSize: '22px', fontWeight: '800', color: '#3B2213', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(59,34,19,0.1)' }}>
                0
              </button>
              <button className="numpad-btn" onClick={() => { setPinEntry(prev => prev.slice(0, -1)); setError(''); }} style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#3B2213', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(59,34,19,0.2)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <span className="bottom-link" onClick={() => { setSelectedCashier(null); setPinEntry(''); setError(''); }} style={{ color: '#3B2213', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ← Switch User
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}