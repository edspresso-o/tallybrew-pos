import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SECRET_KEY = "TallyBrew@2026_SecureVault_X99!";

const encryptData = (data) => {
  const text = JSON.stringify(data); let result = '';
  for (let i = 0; i < text.length; i++) result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  return btoa(result); 
};
const decryptData = (encryptedData) => {
  try {
    const text = atob(encryptedData); let result = '';
    for (let i = 0; i < text.length; i++) result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    return JSON.parse(result);
  } catch (e) { return null; }
};

export default function CashierLock({ onUnlock }) {
  const [cashiers, setCashiers] = useState([]);
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [pinEntry, setPinEntry] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [isAddingCashier, setIsAddingCashier] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('cashier');
  const [addStatusMsg, setAddStatusMsg] = useState('');
  const [isAddError, setIsAddError] = useState(false);

  const fetchCashiers = async () => {
    setIsLoading(true);
    const activeBranch = localStorage.getItem('tallybrew_branch');
    
    // OFFLINE ENHANCEMENT: Strictly filter by branch to prevent showing all accounts
    if (!navigator.onLine) {
      const cachedProfiles = localStorage.getItem('tb_cache_profiles');
      if (cachedProfiles && activeBranch) {
        const parsedProfiles = decryptData(cachedProfiles);
        if (parsedProfiles && Array.isArray(parsedProfiles)) {
          let filtered = parsedProfiles;
          if (activeBranch === 'admin_remote') {
            filtered = filtered.filter(p => !p.branch_id);
          } else {
            // String conversion ensures the offline check doesn't fail due to type mismatch
            filtered = filtered.filter(p => String(p.branch_id) === String(activeBranch));
          }
          setCashiers(filtered.sort((a, b) => a.username.localeCompare(b.username)));
        }
      } else {
        setCashiers([]); // Hide all if no branch is selected
      }
      setIsLoading(false);
      return;
    }

    // NORMAL ONLINE FETCH
    let query = supabase.from('profiles').select('*').order('username');
    if (activeBranch === 'admin_remote') {
      query = query.is('branch_id', null);
    } else if (activeBranch) {
      query = query.eq('branch_id', activeBranch);
    }

    const { data } = await query;
    if (data) {
      setCashiers(data);
      localStorage.setItem('tb_cache_profiles', encryptData(data));
    }
    
    setIsLoading(false); 
  };

  useEffect(() => {
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

  const handleEmergencyLogout = async () => {
    if (navigator.onLine) {
      try { await supabase.auth.signOut(); } catch (e) {}
    }
    // Wipes all location data and completely locks the offline vault
    localStorage.removeItem('tallybrew_branch');
    localStorage.removeItem('tb_offline_session'); 
    window.location.reload();
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName.trim() || newStaffPin.length !== 6) {
      setIsAddError(true);
      setAddStatusMsg("Name is required and PIN must be 6 digits.");
      return;
    }

    if (!navigator.onLine) {
      setIsAddError(true);
      setAddStatusMsg("Cannot add staff while offline.");
      return;
    }

    try {
      const activeBranch = localStorage.getItem('tallybrew_branch');
      const { error } = await supabase.from('profiles').insert([{ 
        username: newStaffName, 
        pin: newStaffPin, 
        role: newStaffRole,
        branch_id: activeBranch === 'admin_remote' ? null : activeBranch
      }]);

      if (error) throw error;

      setIsAddError(false);
      setAddStatusMsg(`Success! ${newStaffName} added.`);
      
      setTimeout(() => {
        setAddStatusMsg('');
        setIsAddingCashier(false);
        setNewStaffName('');
        setNewStaffPin('');
        setNewStaffRole('cashier');
        fetchCashiers(); 
      }, 1500);

    } catch (err) {
      setIsAddError(true);
      setAddStatusMsg("Error. Username might already exist.");
    }
  };

  const renderLogo = () => {
    if (!logoError) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '15px' }}>
          <img 
            src="/images/TallyBrewPosLogo.png" 
            alt="TallyBrew Logo" 
            style={{ 
              maxWidth: '450px', 
              width: '100%', 
              height: 'auto', 
              marginBottom: '0px',
              filter: 'drop-shadow(0 15px 25px rgba(59,34,19,0.15))',
              animation: 'fadeInDown 0.6s ease-out'
            }} 
            onError={() => setLogoError(true)}
          />
        </div>
      );
    }
    return (
      <img 
        src={`${import.meta.env.BASE_URL}images/TallyBrewPosLogo.png`} 
        alt="TallyBrew Logo" 
        style={{ maxWidth: '450px', width: '100%', height: 'auto', marginBottom: '0px' }} 
      />
    );
  };

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDFBF7', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
      
      <div style={{ position: 'relative', width: '70px', height: '70px', marginBottom: '25px' }}>
        <div style={{ boxSizing: 'border-box', display: 'block', position: 'absolute', width: '70px', height: '70px', border: '4px solid #E6D0A9', borderRadius: '50%', animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite', borderTopColor: '#B56124' }}></div>
        <svg style={{ position: 'absolute', top: '21px', left: '21px', color: '#3B2213', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
          <line x1="6" y1="2" x2="6" y2="4"></line>
          <line x1="10" y1="2" x2="10" y2="4"></line>
          <line x1="14" y1="2" x2="14" y2="4"></line>
        </svg>
      </div>

      <h2 style={{ color: '#3B2213', fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px', margin: 0, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
        Brewing your dashboard...
      </h2>
      <p style={{ color: '#B56124', fontSize: '14px', fontWeight: '700', marginTop: '8px' }}>
        Please wait a moment
      </p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minHeight: '100vh', backgroundColor: '#FDFBF7', fontFamily: "'Inter', sans-serif", padding: '6vh 20px 20px', overflowY: 'auto', boxSizing: 'border-box' }}>
      
      <style>{`
        @keyframes lockShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .shake-animation { animation: lockShake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        
        .user-circle { transition: all 0.2s ease; cursor: pointer; border: 3px solid transparent; }
        .user-circle:hover { transform: translateY(-5px); border-color: #B56124; box-shadow: 0 12px 24px rgba(59,34,19,0.15); }
        
        .numpad-btn { transition: all 0.1s ease-out; cursor: pointer; }
        .numpad-btn:hover { filter: brightness(0.95); transform: scale(1.05); }
        .numpad-btn:active { transform: scale(0.95); }
        
        .bottom-link { transition: all 0.2s ease; cursor: pointer; }
        .bottom-link:hover { opacity: 0.6; }
      `}</style>

      {renderLogo()}

      <div className={isShaking ? 'shake-animation' : ''} style={{ background: '#E6D0A9', borderRadius: '32px', padding: '30px 25px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.2)', animation: 'fadeIn 0.5s ease-out', border: '2px solid #D5B888', boxSizing: 'border-box' }}>
        
        {isAddingCashier ? (
          
          <div style={{ animation: 'fadeIn 0.3s ease-out', textAlign: 'left' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
               <h2 style={{ color: '#3B2213', fontSize: '24px', fontWeight: '900', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>New Cashier</h2>
               <p style={{ color: '#B56124', fontSize: '13px', margin: 0, fontWeight: '700' }}>Register a profile for this terminal.</p>
            </div>
            
            {addStatusMsg && (
              <div style={{ background: isAddError ? '#fef2f2' : '#ecfdf5', color: isAddError ? '#dc2626' : '#059669', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', marginBottom: '15px', textAlign: 'center', border: isAddError ? '1px solid #fecaca' : '1px solid #a7f3d0' }}>
                {addStatusMsg}
              </div>
            )}

            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                 <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#B56124', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</label>
                 <input type="text" placeholder="e.g., Jane" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} style={{ width: '100%', padding: '12px 15px', borderRadius: '12px', border: '2px solid #D5B888', background: '#FDFBF7', fontSize: '15px', fontWeight: '700', color: '#3B2213', outline: 'none', boxSizing: 'border-box' }} required />
              </div>
              
              <div>
                 <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#B56124', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assign 6-Digit PIN</label>
                 <input type="password" maxLength={6} value={newStaffPin} onChange={e => setNewStaffPin(e.target.value.replace(/[^0-9]/g, ''))} placeholder="••••••" style={{ width: '100%', padding: '12px 15px', borderRadius: '12px', border: '2px solid #D5B888', background: '#FDFBF7', fontSize: '20px', letterSpacing: '4px', fontWeight: '900', color: '#3B2213', outline: 'none', boxSizing: 'border-box', textAlign: 'left' }} required />
              </div>
              
              <div>
                 <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#B56124', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</label>
                 <select value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)} style={{ width: '100%', padding: '12px 15px', borderRadius: '12px', border: '2px solid #D5B888', background: '#FDFBF7', fontSize: '14px', fontWeight: '700', color: '#3B2213', outline: 'none', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' }}>
                   <option value="cashier">Standard Cashier</option>
                   <option value="manager">Store Manager</option>
                 </select>
              </div>
              
              <button type="submit" disabled={!newStaffName || newStaffPin.length !== 6} style={{ padding: '14px', borderRadius: '12px', border: 'none', background: '#3B2213', color: '#fff', fontWeight: '900', fontSize: '15px', cursor: (!newStaffName || newStaffPin.length !== 6) ? 'not-allowed' : 'pointer', opacity: (!newStaffName || newStaffPin.length !== 6) ? 0.6 : 1, marginTop: '8px', boxShadow: '0 4px 12px rgba(59,34,19,0.2)', transition: '0.2s' }}>
                Create Profile
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <span className="bottom-link" onClick={() => { setIsAddingCashier(false); setAddStatusMsg(''); }} style={{ color: '#3B2213', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>
                ← Cancel
              </span>
            </div>
          </div>

        ) : !selectedCashier ? (
          
          <>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <h2 style={{ color: '#3B2213', fontSize: '24px', fontWeight: '900', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>
                {localStorage.getItem('tallybrew_branch') === 'admin_remote' ? 'Admin Access' : 'Select User'}
              </h2>
              <p style={{ color: '#B56124', fontSize: '13px', margin: 0, fontWeight: '700' }}>Tap your profile to sign in.</p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
              
              {cashiers.map(c => (
                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px' }}>
                  <div 
                    className="user-circle" 
                    onClick={() => setSelectedCashier(c)}
                    style={{ width: '60px', height: '60px', borderRadius: '50%', background: c.role === 'manager' || c.role === 'admin' ? '#B56124' : '#3B2213', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '900', boxShadow: '0 8px 16px rgba(59, 34, 19, 0.15)' }}
                  >
                    {c.username.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ color: '#3B2213', fontWeight: '900', fontSize: '13px', marginTop: '10px', textAlign: 'center', wordBreak: 'break-word', lineHeight: '1.2' }}>{c.username}</div>
                  <div style={{ color: '#B56124', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>{c.role}</div>
                </div>
              ))}

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px' }}>
                <div 
                  className="user-circle" 
                  onClick={() => setIsAddingCashier(true)}
                  style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'transparent', border: '3px dashed #B56124', color: '#B56124', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '900', boxSizing: 'border-box' }}
                >
                  +
                </div>
                <div style={{ color: '#3B2213', fontWeight: '900', fontSize: '13px', marginTop: '10px', textAlign: 'center' }}>New</div>
                <div style={{ color: '#B56124', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>Staff</div>
              </div>

            </div>

            <div style={{ borderTop: '2px dashed #D5B888', marginTop: '25px', paddingTop: '15px', textAlign: 'center' }}>
              <span className="bottom-link" onClick={handleEmergencyLogout} style={{ color: '#dc2626', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}>
                Sign Out Terminal
              </span>
            </div>
          </>
          
        ) : (

          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <div style={{ width: '50px', height: '50px', margin: '0 auto 8px', borderRadius: '50%', background: selectedCashier.role === 'manager' || selectedCashier.role === 'admin' ? '#B56124' : '#3B2213', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900', boxShadow: '0 6px 12px rgba(59,34,19,0.2)' }}>
                {selectedCashier.username.charAt(0).toUpperCase()}
              </div>
              <h2 style={{ color: '#3B2213', fontSize: '18px', fontWeight: '900', margin: '0 0 2px 0', letterSpacing: '-0.5px' }}>{selectedCashier.username}</h2>
              <p style={{ color: error ? '#dc2626' : '#B56124', fontSize: '12px', fontWeight: '800', margin: 0 }}>
                {error || 'Enter your PIN'}
              </p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              {[...Array(getTargetPin().length)].map((_, i) => (
                <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', transition: 'all 0.2s', background: i < pinEntry.length ? '#3B2213' : '#F5E8D2', transform: i < pinEntry.length ? 'scale(1.15)' : 'scale(1)', boxShadow: i < pinEntry.length ? '0 3px 6px rgba(59,34,19,0.3)' : 'inset 0 2px 4px rgba(59,34,19,0.1)' }}></div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', justifyItems: 'center', maxWidth: '200px', margin: '0 auto' }}>
              {['1','2','3','4','5','6','7','8','9'].map(num => (
                <button key={num} className="numpad-btn" onClick={() => handlePinPress(num)} style={{ width: '55px', height: '55px', borderRadius: '50%', background: '#F5E8D2', border: 'none', fontSize: '22px', fontWeight: '900', color: '#3B2213', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(59,34,19,0.1)' }}>
                  {num}
                </button>
              ))}
              <button className="numpad-btn" onClick={() => {setPinEntry(''); setError('');}} style={{ width: '55px', height: '55px', borderRadius: '50%', background: '#FDFBF7', border: 'none', fontSize: '18px', fontWeight: '900', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(59,34,19,0.1)' }}>
                C
              </button>
              <button className="numpad-btn" onClick={() => handlePinPress('0')} style={{ width: '55px', height: '55px', borderRadius: '50%', background: '#F5E8D2', border: 'none', fontSize: '22px', fontWeight: '900', color: '#3B2213', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(59,34,19,0.1)' }}>
                0
              </button>
              <button className="numpad-btn" onClick={() => { setPinEntry(prev => prev.slice(0, -1)); setError(''); }} style={{ width: '55px', height: '55px', borderRadius: '50%', background: '#3B2213', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(59,34,19,0.2)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <span className="bottom-link" onClick={() => { setSelectedCashier(null); setPinEntry(''); setError(''); }} style={{ color: '#3B2213', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ← Switch User
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}