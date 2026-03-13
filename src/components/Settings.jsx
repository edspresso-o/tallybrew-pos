import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Settings({ activeCashier, activeShift, onPrepareEndShift }) {
  const [activeTab, setActiveTab] = useState('shift');
  const [newPin, setNewPin] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  
  const [shiftLogs, setShiftLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const isAdmin = activeCashier?.role === 'admin' || activeCashier?.role === 'manager';

  const formattedStartTime = activeShift 
    ? new Date(activeShift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Not Clocked In';

  useEffect(() => {
    if (activeTab === 'history' && isAdmin) {
      fetchShiftLogs();
    }
  }, [activeTab, isAdmin]);

  const fetchShiftLogs = async () => {
    setLoadingLogs(true);
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('status', 'closed')
      .order('end_time', { ascending: false });
      
    if (data) setShiftLogs(data);
    setLoadingLogs(false);
  };

  const handleUpdatePin = async (e) => {
    e.preventDefault();
    if (newPin.length !== 6) {
      setIsError(true);
      setStatusMsg("PIN must be exactly 6 digits.");
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pin: newPin })
        .eq('username', activeCashier.username);

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

  const formatMoney = (amount) => {
    return `₱ ${Number(amount).toFixed(2)}`;
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#FDFBF7', minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ADDED textAlign: 'left' HERE */}
      <div style={{ marginBottom: '30px', textAlign: 'left' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#3B2213', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>
          Account Settings
        </h1>
        <p style={{ color: '#6b7280', fontSize: '15px', margin: 0, fontWeight: '500' }}>
          Manage your profile, active register, and system logs.
        </p>
      </div>

      {/* TABS - ADDED justifyContent: 'flex-start' */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '30px', borderBottom: '2px solid #e5e7eb', marginBottom: '30px' }}>
        <div 
          onClick={() => setActiveTab('shift')}
          style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', color: activeTab === 'shift' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'shift' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}
        >
          My Shift
        </div>
        <div 
          onClick={() => setActiveTab('security')}
          style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', color: activeTab === 'security' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'security' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}
        >
          Security PIN
        </div>
        
        {isAdmin && (
          <div 
            onClick={() => setActiveTab('history')}
            style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', color: activeTab === 'history' ? '#B56124' : '#9ca3af', borderBottom: activeTab === 'history' ? '3px solid #B56124' : '3px solid transparent', transition: 'all 0.2s' }}
          >
            Shift History (Admin)
          </div>
        )}
      </div>

      {/* TAB 1: SHIFT DETAILS */}
      {activeTab === 'shift' && (
        <div style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(59, 34, 19, 0.05)', maxWidth: '500px', animation: 'fadeIn 0.3s ease-out', textAlign: 'left' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#3B2213', margin: '0 0 25px 0' }}>Current Shift Details</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: '#FDFBF7', borderRadius: '16px', border: '1px solid #E6D0A9' }}>
              <span style={{ color: '#6b7280', fontWeight: '700', fontSize: '14px' }}>Active User:</span>
              <span style={{ color: '#3B2213', fontWeight: '800', fontSize: '14px' }}>{activeCashier?.username || 'Unknown'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: '#FDFBF7', borderRadius: '16px', border: '1px solid #E6D0A9' }}>
              <span style={{ color: '#6b7280', fontWeight: '700', fontSize: '14px' }}>Clocked In At:</span>
              <span style={{ color: '#3B2213', fontWeight: '800', fontSize: '14px' }}>{formattedStartTime}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: '#FDFBF7', borderRadius: '16px', border: '1px solid #E6D0A9' }}>
              <span style={{ color: '#6b7280', fontWeight: '700', fontSize: '14px' }}>Starting Float:</span>
              <span style={{ color: '#B56124', fontWeight: '900', fontSize: '14px' }}>{formatMoney(activeShift?.starting_cash || 0)}</span>
            </div>
          </div>

          <div style={{ borderTop: '2px dashed #E6D0A9', paddingTop: '25px' }}>
             <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', margin: '0 0 15px 0', lineHeight: '1.5' }}>
               Closing the register will lock the terminal and require manager verification for final cash counts.
             </p>
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
        <div style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(59, 34, 19, 0.05)', animation: 'fadeIn 0.3s ease-out', textAlign: 'left' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#3B2213', margin: '0 0 20px 0' }}>Shift Logs & Drawer Records</h2>
          
          {loadingLogs ? (
            <p style={{ color: '#B56124', fontWeight: '700' }}>Loading logs...</p>
          ) : shiftLogs.length === 0 ? (
            <p style={{ color: '#6b7280', fontWeight: '500' }}>No closed shifts found in the database.</p>
          ) : (
            
            <div style={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'auto', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', position: 'relative' }}>
                
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr style={{ textAlign: 'left', backgroundColor: '#FDFBF7' }}>
                    <th style={{ padding: '18px 15px', fontSize: '12px', fontWeight: '900', color: '#B56124', textTransform: 'uppercase', borderBottom: '2px solid #3B2213' }}>Date</th>
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
                        <td style={{ padding: '16px 15px', fontSize: '14px', fontWeight: '600', color: '#3B2213' }}>
                          {startDate.toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px 15px', fontSize: '14px', fontWeight: '800', color: '#3B2213' }}>
                          {log.cashier_name}
                        </td>
                        <td style={{ padding: '16px 15px', fontSize: '13px', fontWeight: '500', color: '#6b7280' }}>
                          {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - <br/>
                          {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '16px 15px', fontSize: '14px', fontWeight: '800', color: '#111' }}>
                          {formatMoney(log.expected_cash)}
                        </td>
                        <td style={{ padding: '16px 15px', fontSize: '14px', fontWeight: '800', color: '#111' }}>
                          {formatMoney(log.actual_cash)}
                        </td>
                        <td style={{ padding: '16px 15px', fontSize: '14px', fontWeight: '900' }}>
                          {shortage === 0 ? (
                            <span style={{ color: '#10b981', background: '#ecfdf5', padding: '6px 12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>Perfect</span>
                          ) : shortage < 0 ? (
                            <span style={{ color: '#dc2626', background: '#fef2f2', padding: '6px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>Short: {formatMoney(Math.abs(shortage))}</span>
                          ) : (
                            <span style={{ color: '#B56124', background: '#FDFBF7', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E6D0A9' }}>Over: {formatMoney(shortage)}</span>
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

    </div>
  );
}