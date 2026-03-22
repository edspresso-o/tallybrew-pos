import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Settings({ activeCashier, activeShift, onUpdateShift, onPrepareEndShift, branchId }) {
  const [activeTab, setActiveTab] = useState('shift');
  const [newPin, setNewPin] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  
  const [shiftLogs, setShiftLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // --- Branch Management States ---
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  const [branchStatusMsg, setBranchStatusMsg] = useState('');
  const [isBranchError, setIsBranchError] = useState(false);

  // --- Staff Management States ---
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('cashier');
  const [newStaffBranch, setNewStaffBranch] = useState(''); 
  const [staffStatusMsg, setStaffStatusMsg] = useState('');
  const [isStaffError, setIsStaffError] = useState(false);

  // --- Skim / Cash Drop States ---
  const [showSkimModal, setShowSkimModal] = useState(false);
  const [skimAmount, setSkimAmount] = useState('');
  const [isSkimming, setIsSkimming] = useState(false);

  const isAdmin = activeCashier?.role === 'admin' || activeCashier?.role === 'manager';

  // THE SAFARI FIX: Safely parse dates so iPhones and iPads stop crashing to a white screen.
  const formatSafeTime = (dateString) => {
    if (!dateString) return 'Not Clocked In';
    try {
      const safeString = dateString.replace(' ', 'T'); // Apple requires 'T' in dates
      const d = new Date(safeString);
      return isNaN(d.getTime()) ? 'Unknown Time' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return 'Error'; }
  };

  const formatSafeDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    try {
      const safeString = dateString.replace(' ', 'T');
      const d = new Date(safeString);
      return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
    } catch (e) { return 'Error'; }
  };

  const formattedStartTime = formatSafeTime(activeShift?.start_time);

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
    try {
      let query = supabase.from('shifts').select('*').eq('status', 'closed').order('end_time', { ascending: false });
      if (branchId && branchId !== 'admin_remote') query = query.eq('branch_id', branchId);
      const { data } = await query;
      if (data) setShiftLogs(data);
    } catch(e) { console.error("Log error", e); }
    setLoadingLogs(false);
  };

  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const { data } = await supabase.from('branches').select('*').order('name');
      if (data) setBranches(data);
    } catch(e) { console.error("Branch error", e); }
    setLoadingBranches(false);
  };

  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      let query = supabase.from('profiles').select('*').order('username');
      if (branchId && branchId !== 'admin_remote') query = query.eq('branch_id', branchId);
      const { data } = await query;
      if (data) setStaffList(data);
    } catch(e) { console.error("Staff error", e); }
    setLoadingStaff(false);
  };

  const handleRecordSkim = async () => {
    const dropAmount = parseFloat(skimAmount);
    if (!dropAmount || dropAmount <= 0) return;

    setIsSkimming(true);
    try {
      const currentDrops = Number(activeShift?.cash_drops || 0);
      const newTotalDrops = currentDrops + dropAmount;

      const { error } = await supabase
        .from('shifts')
        .update({ cash_drops: newTotalDrops })
        .eq('id', activeShift?.id);

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
      const { error } = await supabase.from('profiles').update({ pin: newPin }).eq('username', activeCashier?.username);
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

  const formatMoney = (amount) => `₱ ${Number(amount || 0).toFixed(2)}`;
  
  const getBranchName = (bId) => {
    if (!bId || bId === 'main') return 'Main Branch'; 
    const found = branches.find(b => b.id === bId);
    return found ? found.name : 'Unknown Branch';
  };

  return (
    <div style={{ padding: '40px', paddingTop: '80px', backgroundColor: '#FDFBF7', minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}>
      
      {showSkimModal && (
        <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '90%', maxWidth: '400px', borderRadius: '32px', padding: '40px 35px', textAlign: 'center', backgroundColor: '#E6D0A9', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', animation: 'popIn 0.3s' }}>
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
                <input type="number" value={skimAmount} onChange={(e) => setSkimAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '32px', fontWeight: '900', color: '#3B2213', padding: 0 }} autoFocus />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => {setShowSkimModal(false); setSkimAmount('');}} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#FDFBF7', color: '#3B2213', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRecordSkim} disabled={isSkimming || !skimAmount} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#3B2213', color: '#FDFBF7', fontWeight: '900', fontSize: '15px', cursor: (!skimAmount || isSkimming) ? 'not-allowed' : 'pointer', opacity: (!skimAmount || isSkimming) ? 0.6 : 1, boxShadow: '0 4px 12px rgba(59, 34, 19, 0.3)' }}>{isSkimming ? 'Saving...' : 'Drop Cash'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '30px', textAlign: 'left' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#3B2213', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>Account Settings</h1>
        <p style={{ color: '#6b7280', fontSize: '15px', margin: 0, fontWeight: '500' }}>Manage your profile, active register, and system logs.</p>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '30px', borderBottom: '2px solid #e5e7eb', marginBottom: '30px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div onClick={() => setActiveTab('shift')} style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', whiteSpace: 'nowrap', color: activeTab === 'shift' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'shift' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}>My Shift</div>
        <div onClick={() => setActiveTab('security')} style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', whiteSpace: 'nowrap', color: activeTab === 'security' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'security' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}>Security PIN</div>
        {isAdmin && (
          <>
            <div onClick={() => setActiveTab('history')} style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', whiteSpace: 'nowrap', color: activeTab === 'history' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'history' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}>Shift History</div>
            <div onClick={() => setActiveTab('locations')} style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', whiteSpace: 'nowrap', color: activeTab === 'locations' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'locations' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}>Manage Locations</div>
            <div onClick={() => setActiveTab('staff')} style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', whiteSpace: 'nowrap', color: activeTab === 'staff' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'staff' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}>Manage Staff</div>
          </>
        )}
      </div>

      {/* TAB 1: SHIFT DETAILS */}
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
              <span style={{ color: '#B56124', fontWeight: '900', fontSize: '14px' }}>{formatMoney(activeShift?.starting_cash)}</span>
            </div>

            {Number(activeShift?.cash_drops || 0) > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', padding: '16px 20px', background: '#fef2f2', borderRadius: '16px', border: '1px dashed #fecaca' }}>
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

      {/* TAB 2: UPDATE SECURITY PIN */}
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

      {/* TAB 3: SHIFT HISTORY */}
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
                    const shortage = Number(log.shortage);
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F5E8D2'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fff' : '#fafafa'}>
                        <td style={{ padding: '16px 15px', fontSize: '14px', fontWeight: '600', color: '#3B2213' }}>{formatSafeDate(log.start_time)}</td>
                        <td style={{ padding: '16px 15px', fontSize: '14px', fontWeight: '800', color: '#B56124' }}>{getBranchName(log.branch_id)}</td>
                        <td style={{ padding: '16px 15px', fontSize: '14px', fontWeight: '800', color: '#3B2213' }}>{log.cashier_name}</td>
                        <td style={{ padding: '16px 15px', fontSize: '13px', fontWeight: '500', color: '#6b7280' }}>
                          {formatSafeTime(log.start_time)} - <br/>
                          {formatSafeTime(log.end_time)}
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

      {/* TAB 4: MANAGE LOCATIONS */}
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

      {/* TAB 5: MANAGE STAFF */}
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
                  <div key={staff.id} style={{ display: 'flex', alignItems: 'center', padding: '20px', background: '#FDFBF7', borderRadius: '16px', border: '1px solid #E6D0A9' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: staff.role === 'manager' || staff.role === 'admin' ? '#B56124' : '#3B2213', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginRight: '15px', fontWeight: '900', boxShadow: '0 4px 8px rgba(59,34,19,0.15)', flexShrink: 0 }}>
                      {String(staff.username || '').charAt(0).toUpperCase() || '?'}
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ color: '#3B2213', fontWeight: '900', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.username}</div>
                      <div style={{ color: '#B56124', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {staff.role} {branchId === 'admin_remote' ? ` • ${getBranchName(staff.branch_id)}` : ''}
                      </div>
                    </div>
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
                  <option value="cashier">Standard Cashier</option>
                  <option value="manager">Store Manager</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={!newStaffName.trim() || newStaffPin.length !== 6 || (branchId === 'admin_remote' && !newStaffBranch)}
                style={{ padding: '18px', borderRadius: '16px', border: 'none', background: '#3B2213', color: '#fff', fontWeight: '900', fontSize: '15px', cursor: (!newStaffName.trim() || newStaffPin.length !== 6 || (branchId === 'admin_remote' && !newStaffBranch)) ? 'not-allowed' : 'pointer', opacity: (!newStaffName.trim() || newStaffPin.length !== 6 || (branchId === 'admin_remote' && !newStaffBranch)) ? 0.6 : 1, transition: '0.2s', boxShadow: '0 8px 15px rgba(59, 34, 19, 0.2)', marginTop: '10px' }}
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