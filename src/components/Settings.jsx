import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Settings({ activeCashier, activeShift, onUpdateShift, onPrepareEndShift, branchId }) {
  const [activeTab, setActiveTab] = useState('shift');
  const [newPin, setNewPin] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [shiftLogs, setShiftLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  const [branchStatusMsg, setBranchStatusMsg] = useState('');
  const [isBranchError, setIsBranchError] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('cashier');
  const [newStaffBranch, setNewStaffBranch] = useState(''); 
  const [staffStatusMsg, setStaffStatusMsg] = useState('');
  const [isStaffError, setIsStaffError] = useState(false);
  const [showSkimModal, setShowSkimModal] = useState(false);
  const [skimAmount, setSkimAmount] = useState('');
  const [isSkimming, setIsSkimming] = useState(false);
  const [cashierToRemove, setCashierToRemove] = useState(null);
  const [isRemovingCashier, setIsRemovingCashier] = useState(false);

  const isAdmin = activeCashier?.role === 'admin' || activeCashier?.role === 'manager';

  const formattedStartTime = activeShift 
    ? new Date(activeShift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Not Clocked In';

  useEffect(() => {
    if (isAdmin) {
      fetchBranches();
    }
    if (activeTab === 'history' && isAdmin) {
      fetchShiftLogs();
    } else if (activeTab === 'locations' && isAdmin) {
      fetchBranches();
    } else if (activeTab === 'staff' && isAdmin) {
      fetchStaff();
    }
  }, [activeTab, isAdmin, branchId]);

  const fetchShiftLogs = async () => {
    setLoadingLogs(true);
    let query = supabase.from('shifts').select('*').eq('status', 'closed').order('end_time', { ascending: false });
    if (branchId && branchId !== 'admin_remote') query = query.eq('branch_id', branchId);
    const { data } = await query;
    if (data) setShiftLogs(data);
    setLoadingLogs(false);
  };

  const fetchBranches = async () => {
    setLoadingBranches(true);
    const { data } = await supabase.from('branches').select('*').order('name');
    if (data) setBranches(data);
    setLoadingBranches(false);
  };

  const fetchStaff = async () => {
    setLoadingStaff(true);
    let query = supabase.from('profiles').select('*').order('username');
    if (branchId && branchId !== 'admin_remote') query = query.eq('branch_id', branchId);
    const { data } = await query;
    if (data) setStaffList(data);
    setLoadingStaff(false);
  };

  const handleRecordSkim = async () => {
    const dropAmount = parseFloat(skimAmount);
    if (!dropAmount || dropAmount <= 0) return;

    setIsSkimming(true);
    try {
      const currentDrops = Number(activeShift.cash_drops || 0);
      const newTotalDrops = currentDrops + dropAmount;

      const { error } = await supabase
        .from('shifts')
        .update({ cash_drops: newTotalDrops })
        .eq('id', activeShift.id);

      if (error) throw error;

      if (onUpdateShift) {
        onUpdateShift({ ...activeShift, cash_drops: newTotalDrops });
      }
      
      setShowSkimModal(false);
      setSkimAmount('');
    } catch (err) {
      alert("Error recording cash drop: " + err.message);
    }
    setIsSkimming(false);
  };

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

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!newBranchName.trim()) {
      setIsBranchError(true);
      setBranchStatusMsg("Branch Name is required.");
      return;
    }
    try {
      const { error } = await supabase.from('branches').insert([{ name: newBranchName, location: newBranchLocation }]);
      if (error) throw error;
      setIsBranchError(false);
      setBranchStatusMsg(`Success! ${newBranchName} is now live.`);
      setNewBranchName('');
      setNewBranchLocation('');
      fetchBranches(); 
      setTimeout(() => setBranchStatusMsg(''), 4000);
    } catch (err) {
      setIsBranchError(true);
      setBranchStatusMsg("Error: Could not add branch. Name might already exist.");
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName.trim() || newStaffPin.length !== 6) {
      setIsStaffError(true);
      setStaffStatusMsg("Name is required and PIN must be exactly 6 digits.");
      return;
    }

    let assignedBranch = branchId;
    if (branchId === 'admin_remote') {
      if (!newStaffBranch) {
        setIsStaffError(true);
        setStaffStatusMsg("Please assign the staff member to a branch.");
        return;
      }
      assignedBranch = newStaffBranch;
    }

    try {
      const { error } = await supabase.from('profiles').insert([{ 
        username: newStaffName, 
        pin: newStaffPin, 
        role: newStaffRole,
        branch_id: assignedBranch
      }]);

      if (error) throw error;

      setIsStaffError(false);
      setStaffStatusMsg(`Success! ${newStaffName} has been added to the roster.`);
      setNewStaffName('');
      setNewStaffPin('');
      setNewStaffRole('cashier');
      setNewStaffBranch('');
      fetchStaff(); 
      setTimeout(() => setStaffStatusMsg(''), 4000);
    } catch (err) {
      setIsStaffError(true);
      setStaffStatusMsg("Error: Could not add staff. Username might already exist.");
    }
  };

  const handleRemoveCashier = async () => {
    if (!cashierToRemove) return;
    setIsRemovingCashier(true);
    
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', cashierToRemove.id);
      if (error) throw error;

      setStaffStatusMsg(`${cashierToRemove.username} has been removed from the roster.`);
      setIsStaffError(false);
      setCashierToRemove(null);
      fetchStaff();
      setTimeout(() => setStaffStatusMsg(''), 4000);

    } catch (err) {
      setStaffStatusMsg("System Error: Could not remove cashier.");
      setIsStaffError(true);
    } finally {
      setIsRemovingCashier(false);
    }
  };

  const formatMoney = (amount) => `₱ ${Number(amount).toFixed(2)}`;
  
  const getBranchName = (bId) => {
    if (!bId || bId === 'main') return 'Main Branch'; 
    const found = branches.find(b => b.id === bId);
    return found ? found.name : 'Unknown Branch';
  };

  return (
    
    <div style={{ padding: '40px', paddingTop: '60px', backgroundColor: '#FDFBF7', minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}>
      
      {showSkimModal && (
        <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          
          <style>{`
            .hide-arrows::-webkit-outer-spin-button,
            .hide-arrows::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            .hide-arrows {
              -moz-appearance: textfield;
            }
          `}</style>

          <div style={{ width: '400px', borderRadius: '32px', padding: '40px 35px', textAlign: 'center', backgroundColor: '#E6D0A9', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', border: '3px solid #3B2213', animation: 'popIn 0.3s' }}>
            
            <div style={{ width: '80px', height: '80px', backgroundColor: '#FDFBF7', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #3B2213', boxShadow: '0 8px 16px rgba(59,34,19,0.1)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
            </div>

            <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 10px', color: '#3B2213', letterSpacing: '-0.5px' }}>Record Cash Drop</h2>
            
            <p style={{ color: '#3B2213', fontSize: '14px', marginBottom: '30px', fontWeight: '600', opacity: 0.8, lineHeight: '1.4' }}>
              Remove excess cash from the drawer for security. This will be deducted from your expected end-of-shift cash.
            </p>

            <div style={{ position: 'relative', width: '100%', marginBottom: '30px', textAlign: 'left', background: '#FDFBF7', borderRadius: '16px', border: '2px solid #B56124', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 0 0 3px rgba(181,97,36,0.2)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#B56124', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Amount to Drop (₱)</div>
                <input 
                  className="hide-arrows" 
                  type="number" 
                  value={skimAmount} 
                  onChange={(e) => setSkimAmount(e.target.value)} 
                  placeholder="0.00" 
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '32px', fontWeight: '900', color: '#3B2213', padding: 0 }} 
                  autoFocus 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => {setShowSkimModal(false); setSkimAmount('');}} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#FDFBF7', color: '#3B2213', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRecordSkim} disabled={isSkimming || !skimAmount} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#3B2213', color: '#FDFBF7', fontWeight: '900', fontSize: '15px', cursor: (!skimAmount || isSkimming) ? 'not-allowed' : 'pointer', opacity: (!skimAmount || isSkimming) ? 0.6 : 1, boxShadow: '0 4px 12px rgba(59, 34, 19, 0.3)' }}>{isSkimming ? 'Saving...' : 'Drop Cash'}</button>
            </div>

          </div>
        </div>
      )}

      {cashierToRemove && (
        <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          
          <div style={{ width: '400px', borderRadius: '32px', padding: '40px 35px', textAlign: 'center', backgroundColor: '#E6D0A9', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', border: '3px solid #3B2213', animation: 'popIn 0.3s' }}>
            
            <div style={{ width: '80px', height: '80px', backgroundColor: '#FDFBF7', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #3B2213', boxShadow: '0 8px 16px rgba(59,34,19,0.1)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>

            <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 10px', color: '#3B2213', letterSpacing: '-0.5px' }}>Remove Cashier</h2>
            
            <p style={{ color: '#3B2213', fontSize: '14px', marginBottom: '30px', fontWeight: '600', opacity: 0.8, lineHeight: '1.4' }}>
              Are you sure you want to completely remove <strong style={{color: '#B56124'}}>{cashierToRemove.username}</strong> from the system?
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setCashierToRemove(null)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#FDFBF7', color: '#3B2213', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRemoveCashier} disabled={isRemovingCashier} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#3B2213', color: '#FDFBF7', fontWeight: '900', fontSize: '15px', cursor: isRemovingCashier ? 'not-allowed' : 'pointer', opacity: isRemovingCashier ? 0.6 : 1, boxShadow: '0 4px 12px rgba(59, 34, 19, 0.3)' }}>{isRemovingCashier ? 'Removing...' : 'Remove'}</button>
            </div>

          </div>
        </div>
      )}

      <div style={{ marginBottom: '30px', textAlign: 'left' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#3B2213', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>
          Account Settings
        </h1>
        <p style={{ color: '#6b7280', fontSize: '15px', margin: 0, fontWeight: '500' }}>
          Manage your profile, active register, and system logs.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '30px', borderBottom: '2px solid #e5e7eb', marginBottom: '30px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div 
          onClick={() => setActiveTab('shift')}
          style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', whiteSpace: 'nowrap', color: activeTab === 'shift' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'shift' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}
        >
          My Shift
        </div>
        <div 
          onClick={() => setActiveTab('security')}
          style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', whiteSpace: 'nowrap', color: activeTab === 'security' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'security' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}
        >
          Security PIN
        </div>
        
        {isAdmin && (
          <>
            <div 
              onClick={() => setActiveTab('history')}
              style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', whiteSpace: 'nowrap', color: activeTab === 'history' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'history' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}
            >
              Shift History
            </div>
            <div 
              onClick={() => setActiveTab('locations')}
              style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', whiteSpace: 'nowrap', color: activeTab === 'locations' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'locations' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}
            >
              Manage Locations
            </div>
            <div 
              onClick={() => setActiveTab('staff')}
              style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', whiteSpace: 'nowrap', color: activeTab === 'staff' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'staff' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}
            >
              Manage Staff
            </div>
          </>
        )}
      </div>

      {activeTab === 'shift' && (
        <div style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(59, 34, 19, 0.05)', maxWidth: '500px', animation: 'fadeIn 0.3s ease-out', textAlign: 'left' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#3B2213', margin: '0 0 25px 0' }}>Current Shift Details</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', padding: '16px 20px', background: '#FDFBF7', borderRadius: '16px', border: '1px solid #E6D0A9' }}>
              <span style={{ color: '#6b7280', fontWeight: '700', fontSize: '14px' }}>Active User:</span>
              <span style={{ color: '#3B2213', fontWeight: '800', fontSize: '14px' }}>{activeCashier?.username || 'Unknown'}</span>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', padding: '16px 20px', background: '#FDFBF7', borderRadius: '16px', border: '1px solid #E6D0A9' }}>
              <span style={{ color: '#6b7280', fontWeight: '700', fontSize: '14px' }}>Clocked In At:</span>
              <span style={{ color: '#3B2213', fontWeight: '800', fontSize: '14px' }}>{formattedStartTime}</span>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', padding: '16px 20px', background: '#FDFBF7', borderRadius: '16px', border: '1px solid #E6D0A9' }}>
              <span style={{ color: '#6b7280', fontWeight: '700', fontSize: '14px' }}>Starting Float:</span>
              <span style={{ color: '#B56124', fontWeight: '900', fontSize: '14px' }}>{formatMoney(activeShift?.starting_cash || 0)}</span>
            </div>

            {Number(activeShift?.cash_drops || 0) > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', padding: '16px 20px', background: '#fef2f2', borderRadius: '12px', border: '1px dashed #fecaca' }}>
                <span style={{ color: '#dc2626', fontWeight: '700', fontSize: '14px' }}>Total Cash Dropped:</span>
                <span style={{ color: '#dc2626', fontWeight: '900', fontSize: '14px' }}>- {formatMoney(activeShift?.cash_drops)}</span>
              </div>
            )}
          </div>

          <div style={{ borderTop: '2px dashed #E6D0A9', paddingTop: '25px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <button 
                onClick={() => setShowSkimModal(true)}
                disabled={!activeShift}
                style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #E6D0A9', background: '#FDFBF7', color: '#B56124', fontWeight: '900', fontSize: '14px', cursor: !activeShift ? 'not-allowed' : 'pointer', opacity: !activeShift ? 0.5 : 1, transition: '0.2s' }}
             >
                Record Cash Drop (Skim)
             </button>
             
             <button 
                onClick={onPrepareEndShift}
                disabled={!activeShift}
                style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: '#3B2213', color: '#FDFBF7', fontWeight: '900', fontSize: '15px', cursor: !activeShift ? 'not-allowed' : 'pointer', opacity: !activeShift ? 0.5 : 1, transition: '0.2s', boxShadow: '0 8px 15px rgba(59, 34, 19, 0.2)' }}
             >
                Close Register & End Shift
             </button>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(59, 34, 19, 0.05)', maxWidth: '500px', animation: 'fadeIn 0.3s ease-out', textAlign: 'left' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#3B2213', margin: '0 0 10px 0' }}>Update Personal PIN</h2>
          <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '25px', fontWeight: '500', lineHeight: '1.5' }}>
            This 6-digit PIN is used to quickly unlock the screen and authorize actions. Do not share it.
          </p>

          {statusMsg && (
            <div style={{ background: isError ? '#fef2f2' : '#F5E8D2', color: isError ? '#dc2626' : '#B56124', padding: '14px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', marginBottom: '20px', border: `1px solid ${isError ? '#fecaca' : '#E6D0A9'}` }}>
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
                style={{ width: '100%', padding: '18px', boxSizing: 'border-box', background: '#FDFBF7', border: '2px solid #E6D0A9', borderRadius: '16px', fontSize: '24px', fontWeight: '900', letterSpacing: '6px', color: '#3B2213', outline: 'none', transition: 'border-color 0.2s', textAlign: 'center' }}
                onFocus={(e) => e.target.style.borderColor = '#B56124'} 
                onBlur={(e) => e.target.style.borderColor = '#E6D0A9'} 
              />
            </div>

            <button 
              type="submit" 
              disabled={newPin.length !== 6}
              style={{ padding: '18px', borderRadius: '16px', border: 'none', background: '#3B2213', color: '#fff', fontWeight: '900', fontSize: '15px', cursor: newPin.length !== 6 ? 'not-allowed' : 'pointer', opacity: newPin.length !== 6 ? 0.6 : 1, transition: '0.2s', boxShadow: '0 8px 15px rgba(59, 34, 19, 0.2)' }}
            >
              Save New PIN
            </button>
          </form>
        </div>
      )}

      {activeTab === 'history' && isAdmin && (
        <div style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(59, 34, 19, 0.05)', animation: 'fadeIn 0.3s ease-out', textAlign: 'left', overflow: 'hidden' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#3B2213', margin: '0 0 20px 0' }}>Shift Logs & Drawer Records</h2>
          
          {loadingLogs ? (
            <p style={{ color: '#B56124', fontWeight: '700' }}>Loading logs...</p>
          ) : shiftLogs.length === 0 ? (
            <p style={{ color: '#6b7280', fontWeight: '500' }}>No closed shifts found in the database.</p>
          ) : (
            
            <div style={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'auto', borderRadius: '16px', border: '1px solid #e5e7eb', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px', position: 'relative' }}>
                
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr style={{ textAlign: 'left', backgroundColor: '#FDFBF7' }}>
                    <th style={{ padding: '18px 15px', fontSize: '12px', fontWeight: '900', color: '#B56124', textTransform: 'uppercase', borderBottom: '2px solid #3B2213' }}>Date</th>
                    <th style={{ padding: '18px 15px', fontSize: '12px', fontWeight: '900', color: '#B56124', textTransform: 'uppercase', borderBottom: '2px solid #3B2213' }}>Branch</th>
                    <th style={{ padding: '18px 15px', fontSize: '12px', fontWeight: '900', color: '#B56124', textTransform: 'uppercase', borderBottom: '2px solid #3B2213' }}>Cashier</th>
                    <th style={{ padding: '18px 15px', fontSize: '12px', fontWeight: '900', color: '#B56124', textTransform: 'uppercase', borderBottom: '2px solid #3B2213' }}>Start / End</th>
                    <th style={{ padding: '18px 15px', fontSize: '12px', fontWeight: '900', color: '#B56124', textTransform: 'uppercase', borderBottom: '2px solid #3B2213' }}>Expected</th>
                    <th style={{ padding: '18px 15px', fontSize: '12px', fontWeight: '900', color: '#B56124', textTransform: 'uppercase', borderBottom: '2px solid #3B2213' }}>Actual</th>
                    <th style={{ padding: '18px 15px', fontSize: '12px', fontWeight: '900', color: '#B56124', textTransform: 'uppercase', borderBottom: '2px solid #3B2213' }}>Discrepancy</th>
                  </tr>
                </thead>

                <tbody>
                  {shiftLogs.map((log, index) => {
                    const startDate = new Date(log.start_time);
                    const endDate = new Date(log.end_time);
                    const shortage = Number(log.shortage);

                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F5E8D2'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fff' : '#fafafa'}>
                        <td style={{ padding: '16px 15px', fontSize: '14px', fontWeight: '600', color: '#3B2213' }}>{startDate.toLocaleDateString()}</td>
                        <td style={{ padding: '16px 15px', fontSize: '14px', fontWeight: '800', color: '#B56124' }}>{getBranchName(log.branch_id)}</td>
                        <td style={{ padding: '16px 15px', fontSize: '14px', fontWeight: '800', color: '#3B2213' }}>{log.cashier_name}</td>
                        <td style={{ padding: '16px 15px', fontSize: '13px', fontWeight: '500', color: '#6b7280' }}>
                          {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - <br/>
                          {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '16px 15px', fontSize: '14px', fontWeight: '800', color: '#111' }}>{formatMoney(log.expected_cash)}</td>
                        <td style={{ padding: '16px 15px', fontSize: '14px', fontWeight: '800', color: '#111' }}>{formatMoney(log.actual_cash)}</td>
                        <td style={{ padding: '16px 15px', fontSize: '14px', fontWeight: '900' }}>
                          {shortage === 0 ? (
                            <span style={{ color: '#10b981', background: '#ecfdf5', padding: '6px 12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>Perfect</span>
                          ) : shortage < 0 ? (
                            <span style={{ color: '#dc2626', background: '#fef2f2', padding: '6px 12px', borderRadius: '8px', border: '1px solid #fecaca', whiteSpace: 'nowrap' }}>Short: {formatMoney(Math.abs(shortage))}</span>
                          ) : (
                            <span style={{ color: '#B56124', background: '#FDFBF7', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E6D0A9', whiteSpace: 'nowrap' }}>Over: {formatMoney(shortage)}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'locations' && isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', animation: 'fadeIn 0.3s ease-out', textAlign: 'left' }}>
          
          <div style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(59, 34, 19, 0.05)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#3B2213', margin: '0 0 5px 0' }}>Active Branches</h2>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '25px', fontWeight: '500' }}>All TallyBrew physical store locations.</p>
            
            {loadingBranches ? (
              <p style={{ color: '#B56124', fontWeight: '700' }}>Loading locations...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {branches.map(branch => (
                  <div key={branch.id} style={{ display: 'flex', alignItems: 'center', padding: '20px', background: '#FDFBF7', borderRadius: '16px', border: '1px solid #E6D0A9' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#3B2213', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginRight: '15px', fontWeight: '900', flexShrink: 0 }}>
                      B
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ color: '#3B2213', fontWeight: '900', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{branch.name}</div>
                      <div style={{ color: '#B56124', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{branch.location || 'No address set'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(59, 34, 19, 0.05)', height: 'fit-content' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#3B2213', margin: '0 0 5px 0' }}>Expand the Empire</h2>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '25px', fontWeight: '500' }}>Register a new store location to the database.</p>
            
            {branchStatusMsg && (
              <div style={{ background: isBranchError ? '#fef2f2' : '#ecfdf5', color: isBranchError ? '#dc2626' : '#059669', padding: '14px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', marginBottom: '20px', border: `1px solid ${isBranchError ? '#fecaca' : '#a7f3d0'}` }}>
                {branchStatusMsg}
              </div>
            )}

            <form onSubmit={handleAddBranch} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#B56124', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Branch Name
                </label>
                <input 
                  type="text" 
                  placeholder="e.g., TallyBrew - Annex" 
                  value={newBranchName} 
                  onChange={(e) => setNewBranchName(e.target.value)}
                  style={{ width: '100%', padding: '16px 20px', boxSizing: 'border-box', background: '#FDFBF7', border: '2px solid #E6D0A9', borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: '#3B2213', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = '#B56124'} 
                  onBlur={(e) => e.target.style.borderColor = '#E6D0A9'} 
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#B56124', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Physical Location (Optional)
                </label>
                <input 
                  type="text" 
                  placeholder="e.g., North Mall, Ground Floor" 
                  value={newBranchLocation} 
                  onChange={(e) => setNewBranchLocation(e.target.value)}
                  style={{ width: '100%', padding: '16px 20px', boxSizing: 'border-box', background: '#FDFBF7', border: '2px solid #E6D0A9', borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: '#3B2213', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = '#B56124'} 
                  onBlur={(e) => e.target.style.borderColor = '#E6D0A9'} 
                />
              </div>

              <button 
                type="submit" 
                disabled={!newBranchName.trim()}
                style={{ padding: '18px', borderRadius: '16px', border: 'none', background: '#B56124', color: '#fff', fontWeight: '900', fontSize: '15px', cursor: !newBranchName.trim() ? 'not-allowed' : 'pointer', opacity: !newBranchName.trim() ? 0.6 : 1, transition: '0.2s', boxShadow: '0 8px 15px rgba(181, 97, 36, 0.2)', marginTop: '10px' }}
              >
                Add New Branch
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'staff' && isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', animation: 'fadeIn 0.3s ease-out', textAlign: 'left' }}>
          
          <div style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(59, 34, 19, 0.05)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#3B2213', margin: '0 0 5px 0' }}>Current Staff Roster</h2>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '25px', fontWeight: '500' }}>Active cashiers and managers across locations.</p>
            
            {loadingStaff ? (
              <p style={{ color: '#B56124', fontWeight: '700' }}>Loading staff...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {staffList.map(staff => (
                  <div key={staff.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: '#FDFBF7', borderRadius: '16px', border: '1px solid #E6D0A9' }}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: staff.role === 'manager' || staff.role === 'admin' ? '#B56124' : '#3B2213', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginRight: '15px', fontWeight: '900', boxShadow: '0 4px 8px rgba(59,34,19,0.15)', flexShrink: 0 }}>
                        {staff.username.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ color: '#3B2213', fontWeight: '900', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.username}</div>
                        <div style={{ color: '#B56124', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {staff.role} {branchId === 'admin_remote' ? ` • ${getBranchName(staff.branch_id)}` : ''}
                        </div>
                      </div>
                    </div>
                    {staff.username !== activeCashier?.username && (
                      <button 
                        onClick={() => setCashierToRemove(staff)}
                        style={{ padding: '8px 12px', borderRadius: '10px', border: '2px solid #E6D0A9', background: '#FDFBF7', color: '#3B2213', fontWeight: '800', fontSize: '12px', cursor: 'pointer', opacity: isRemovingCashier ? 0.5 : 1 }}
                      >
                        REMOVE
                      </button>
                    )}
                  </div>
                ))}
                {staffList.length === 0 && (
                   <p style={{ color: '#dc2626', fontSize: '14px', fontWeight: '700' }}>No staff registered.</p>
                )}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(59, 34, 19, 0.05)', height: 'fit-content' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#3B2213', margin: '0 0 5px 0' }}>Hire New Cashier</h2>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '25px', fontWeight: '500' }}>Assign a name and a 6-digit PIN to authorize access.</p>
            
            {staffStatusMsg && (
              <div style={{ background: isStaffError ? '#fef2f2' : '#ecfdf5', color: isStaffError ? '#dc2626' : '#059669', padding: '14px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', marginBottom: '20px', border: `1px solid ${isStaffError ? '#fecaca' : '#a7f3d0'}` }}>
                {staffStatusMsg}
              </div>
            )}

            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {branchId === 'admin_remote' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#B56124', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Assign to Branch
                  </label>
                  <select 
                    value={newStaffBranch}
                    onChange={(e) => setNewStaffBranch(e.target.value)}
                    style={{ width: '100%', padding: '16px 20px', boxSizing: 'border-box', background: '#FDFBF7', border: '2px solid #E6D0A9', borderRadius: '16px', fontSize: '15px', fontWeight: '800', color: '#3B2213', outline: 'none', cursor: 'pointer', appearance: 'none' }}
                  >
                    <option value="" disabled>Select a branch...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#B56124', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Cashier Name
                </label>
                <input 
                  type="text" 
                  placeholder="e.g., Jane Doe" 
                  value={newStaffName} 
                  onChange={(e) => setNewStaffName(e.target.value)}
                  style={{ width: '100%', padding: '16px 20px', boxSizing: 'border-box', background: '#FDFBF7', border: '2px solid #E6D0A9', borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: '#3B2213', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = '#B56124'} 
                  onBlur={(e) => e.target.style.borderColor = '#E6D0A9'} 
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#B56124', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Assign 6-Digit PIN
                </label>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="123456" 
                  value={newStaffPin} 
                  onChange={(e) => setNewStaffPin(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{ width: '100%', padding: '16px 20px', boxSizing: 'border-box', background: '#FDFBF7', border: '2px solid #E6D0A9', borderRadius: '16px', fontSize: '20px', fontWeight: '800', letterSpacing: '4px', color: '#3B2213', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.target.style.borderColor = '#B56124'} 
                  onBlur={(e) => e.target.style.borderColor = '#E6D0A9'} 
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#B56124', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  System Role
                </label>
                <select 
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  style={{ width: '100%', padding: '16px 20px', boxSizing: 'border-box', background: '#FDFBF7', border: '2px solid #E6D0A9', borderRadius: '16px', fontSize: '15px', fontWeight: '800', color: '#3B2213', outline: 'none', cursor: 'pointer', appearance: 'none' }}
                >
                  <option value="cashier">Cashier</option>
                  <option value="manager">Store Manager</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={!newStaffName.trim() || newStaffPin.length !== 6 || (branchId === 'admin_remote' && !newStaffBranch)}
                style={{ padding: '16px', borderRadius: '16px', border: 'none', background: '#3B2213', color: '#fff', fontWeight: '900', fontSize: '15px', cursor: (!newStaffName.trim() || newStaffPin.length !== 6 || (branchId === 'admin_remote' && !newStaffBranch)) ? 'not-allowed' : 'pointer', opacity: (!newStaffName.trim() || newStaffPin.length !== 6 || (branchId === 'admin_remote' && !newStaffBranch)) ? 0.6 : 1, transition: '0.2s', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', marginTop: '10px' }}
              >
                Create Cashier Account
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}