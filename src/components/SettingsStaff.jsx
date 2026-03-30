import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function SettingsStaff({ activeCashier, branchId }) {
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [branches, setBranches] = useState([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('cashier');
  const [newStaffBranch, setNewStaffBranch] = useState(''); 
  const [staffStatusMsg, setStaffStatusMsg] = useState('');
  const [isStaffError, setIsStaffError] = useState(false);
  const [cashierToRemove, setCashierToRemove] = useState(null);
  const [isRemovingCashier, setIsRemovingCashier] = useState(false);

  useEffect(() => {
    fetchStaff();
    if (branchId === 'admin_remote') {
      supabase.from('branches').select('*').order('name').then(({data}) => setBranches(data || []));
    }
  }, [branchId]);

  const fetchStaff = async () => {
    setLoadingStaff(true);
    let query = supabase.from('profiles').select('*').order('username');
    if (branchId && branchId !== 'admin_remote') query = query.eq('branch_id', branchId);
    const { data } = await query;
    if (data) setStaffList(data);
    setLoadingStaff(false);
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
      const { error } = await supabase.from('profiles').insert([{ username: newStaffName, pin: newStaffPin, role: newStaffRole, branch_id: assignedBranch }]);
      if (error) throw error;
      setIsStaffError(false);
      setStaffStatusMsg(`Success! ${newStaffName} has been added.`);
      setNewStaffName(''); setNewStaffPin(''); setNewStaffRole('cashier'); setNewStaffBranch('');
      fetchStaff(); 
      setTimeout(() => setStaffStatusMsg(''), 4000);
    } catch (err) {
      setIsStaffError(true);
      setStaffStatusMsg("Error: Could not add staff. Username might exist.");
    }
  };

  const handleRemoveCashier = async () => {
    if (!cashierToRemove) return;
    setIsRemovingCashier(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', cashierToRemove.id);
      if (error) throw error;
      setStaffStatusMsg(`${cashierToRemove.username} has been removed.`);
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

  const getBranchName = (bId) => {
    const found = branches.find(b => b.id === bId);
    return found ? found.name : 'Unknown Branch';
  };

  return (
    <>
      {cashierToRemove && (
        <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '400px', borderRadius: '32px', padding: '40px 35px', textAlign: 'center', backgroundColor: '#E6D0A9', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', border: '3px solid #3B2213', animation: 'popIn 0.3s' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#FDFBF7', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #3B2213', boxShadow: '0 8px 16px rgba(59,34,19,0.1)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 10px', color: '#3B2213', letterSpacing: '-0.5px' }}>Remove Cashier</h2>
            <p style={{ color: '#3B2213', fontSize: '14px', marginBottom: '30px', fontWeight: '600', opacity: 0.8, lineHeight: '1.4' }}>Are you sure you want to completely remove <strong style={{color: '#B56124'}}>{cashierToRemove.username}</strong> from the system?</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setCashierToRemove(null)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#FDFBF7', color: '#3B2213', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRemoveCashier} disabled={isRemovingCashier} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#3B2213', color: '#FDFBF7', fontWeight: '900', fontSize: '15px', cursor: isRemovingCashier ? 'not-allowed' : 'pointer', opacity: isRemovingCashier ? 0.6 : 1 }}>{isRemovingCashier ? 'Removing...' : 'Remove'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', animation: 'fadeIn 0.3s ease-out', textAlign: 'left' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(59, 34, 19, 0.05)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#3B2213', margin: '0 0 5px 0' }}>Current Staff Roster</h2>
          <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '25px', fontWeight: '500' }}>Active cashiers and managers.</p>
          {loadingStaff ? (
            <p style={{ color: '#B56124', fontWeight: '700' }}>Loading staff...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {staffList.map(staff => (
                <div key={staff.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: '#FDFBF7', borderRadius: '16px', border: '1px solid #E6D0A9' }}>
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: staff.role === 'manager' || staff.role === 'admin' ? '#B56124' : '#3B2213', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginRight: '15px', fontWeight: '900', boxShadow: '0 4px 8px rgba(59,34,19,0.15)', flexShrink: 0 }}>{staff.username.charAt(0).toUpperCase()}</div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ color: '#3B2213', fontWeight: '900', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.username}</div>
                      <div style={{ color: '#B56124', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.role} {branchId === 'admin_remote' ? ` • ${getBranchName(staff.branch_id)}` : ''}</div>
                    </div>
                  </div>
                  {staff.username !== activeCashier?.username && (
                    <button onClick={() => setCashierToRemove(staff)} style={{ padding: '8px 12px', borderRadius: '10px', border: '2px solid #E6D0A9', background: '#FDFBF7', color: '#3B2213', fontWeight: '800', fontSize: '12px', cursor: 'pointer', opacity: isRemovingCashier ? 0.5 : 1 }}>REMOVE</button>
                  )}
                </div>
              ))}
              {staffList.length === 0 && <p style={{ color: '#dc2626', fontSize: '14px', fontWeight: '700' }}>No staff registered.</p>}
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(59, 34, 19, 0.05)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#3B2213', margin: '0 0 5px 0' }}>Hire New Cashier</h2>
          <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '25px', fontWeight: '500' }}>Assign a name and a 6-digit PIN.</p>
          {staffStatusMsg && (
            <div style={{ background: isStaffError ? '#fef2f2' : '#ecfdf5', color: isStaffError ? '#dc2626' : '#059669', padding: '14px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', marginBottom: '20px', border: `1px solid ${isStaffError ? '#fecaca' : '#a7f3d0'}` }}>{staffStatusMsg}</div>
          )}
          <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {branchId === 'admin_remote' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#B56124', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assign to Branch</label>
                <select value={newStaffBranch} onChange={(e) => setNewStaffBranch(e.target.value)} style={{ width: '100%', padding: '16px 20px', boxSizing: 'border-box', background: '#FDFBF7', border: '2px solid #E6D0A9', borderRadius: '16px', fontSize: '15px', fontWeight: '800', color: '#3B2213', outline: 'none', cursor: 'pointer', appearance: 'none' }}>
                  <option value="" disabled>Select a branch...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#B56124', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cashier Name</label>
              <input type="text" placeholder="e.g., Jane Doe" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} style={{ width: '100%', padding: '16px 20px', boxSizing: 'border-box', background: '#FDFBF7', border: '2px solid #E6D0A9', borderRadius: '16px', fontSize: '15px', fontWeight: '600', color: '#3B2213', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = '#B56124'} onBlur={(e) => e.target.style.borderColor = '#E6D0A9'} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#B56124', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assign 6-Digit PIN</label>
              <input type="text" maxLength={6} placeholder="123456" value={newStaffPin} onChange={(e) => setNewStaffPin(e.target.value.replace(/[^0-9]/g, ''))} style={{ width: '100%', padding: '16px 20px', boxSizing: 'border-box', background: '#FDFBF7', border: '2px solid #E6D0A9', borderRadius: '16px', fontSize: '20px', fontWeight: '800', letterSpacing: '4px', color: '#3B2213', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.borderColor = '#B56124'} onBlur={(e) => e.target.style.borderColor = '#E6D0A9'} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#B56124', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>System Role</label>
              <select value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value)} style={{ width: '100%', padding: '16px 20px', boxSizing: 'border-box', background: '#FDFBF7', border: '2px solid #E6D0A9', borderRadius: '16px', fontSize: '15px', fontWeight: '800', color: '#3B2213', outline: 'none', cursor: 'pointer', appearance: 'none' }}>
                <option value="cashier">Cashier</option>
                <option value="manager">Store Manager</option>
              </select>
            </div>
            <button type="submit" disabled={!newStaffName.trim() || newStaffPin.length !== 6 || (branchId === 'admin_remote' && !newStaffBranch)} style={{ padding: '16px', borderRadius: '16px', border: 'none', background: '#3B2213', color: '#fff', fontWeight: '900', fontSize: '15px', cursor: (!newStaffName.trim() || newStaffPin.length !== 6 || (branchId === 'admin_remote' && !newStaffBranch)) ? 'not-allowed' : 'pointer', opacity: (!newStaffName.trim() || newStaffPin.length !== 6 || (branchId === 'admin_remote' && !newStaffBranch)) ? 0.6 : 1, transition: '0.2s', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', marginTop: '10px' }}>Create Cashier Account</button>
          </form>
        </div>
      </div>
    </>
  );
}