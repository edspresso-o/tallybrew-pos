import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function SettingsHistory({ branchId }) {
  const [shiftLogs, setShiftLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    fetchBranches();
    fetchShiftLogs();
  }, [branchId]);

  const fetchBranches = async () => {
    const { data } = await supabase.from('branches').select('*');
    if (data) setBranches(data);
  };

  const fetchShiftLogs = async () => {
    setLoadingLogs(true);
    let query = supabase.from('shifts').select('*').eq('status', 'closed').order('end_time', { ascending: false });
    if (branchId && branchId !== 'admin_remote') query = query.eq('branch_id', branchId);
    const { data } = await query;
    if (data) setShiftLogs(data);
    setLoadingLogs(false);
  };

  const formatMoney = (amount) => `₱ ${Number(amount).toFixed(2)}`;
  
  const getBranchName = (bId) => {
    if (!bId || bId === 'main') return 'Main Branch'; 
    const found = branches.find(b => b.id === bId);
    return found ? found.name : 'Unknown Branch';
  };

  return (
    <div style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(59, 34, 19, 0.04)', border: '1px solid #f3f4f6', animation: 'fadeIn 0.4s ease-out', textAlign: 'left', overflow: 'hidden' }} className="mobile-padding-fix">
      
      {/* MOBILE RESPONSIVE CSS INJECTIONS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #FDFBF7; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E6D0A9; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #B56124; }
        
        .table-row-hover { transition: all 0.2s ease; }
        .table-row-hover:hover { background-color: #FDFBF7 !important; transform: scale(1.002); box-shadow: 0 4px 12px rgba(59, 34, 19, 0.05); z-index: 2; position: relative; }

        /* THE MAGIC MOBILE RESPONSIVE BLOCK */
        @media screen and (max-width: 768px) {
          .mobile-padding-fix { padding: 20px !important; }
          .responsive-table { display: block; width: 100%; }
          .responsive-table thead { display: none; } /* Hide headers on mobile */
          .responsive-table tbody { display: block; width: 100%; }
          .responsive-table tr { 
            display: flex; 
            flex-direction: column; 
            margin-bottom: 16px; 
            border: 2px solid #E6D0A9 !important; 
            border-radius: 16px; 
            padding: 16px; 
            background-color: #fff !important;
            box-shadow: 0 4px 10px rgba(0,0,0,0.02);
          }
          .responsive-table tr:hover { transform: none !important; } /* Disable scale hover on mobile */
          .responsive-table td { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 8px 0 !important; 
            border-bottom: 1px dashed #e5e7eb; 
            text-align: right;
          }
          .responsive-table td:last-child { border-bottom: none; }
          
          /* INJECT PSEUDO-LABELS FOR MOBILE ROWS */
          .responsive-table td::before { 
            content: attr(data-label); 
            font-weight: 800; 
            text-transform: uppercase; 
            font-size: 11px; 
            color: #B56124; 
            text-align: left;
            margin-right: 15px;
          }
          
          /* Adjust specific column flexings for mobile */
          .mobile-time-align { text-align: right !important; }
          .mobile-avatar-align { justify-content: flex-end !important; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '25px', borderBottom: '2px solid #E6D0A9', paddingBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#3B2213', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Shift Logs & Drawer Records</h2>
          <p style={{ color: '#B56124', fontSize: '14px', fontWeight: '600', margin: 0 }}>Review past shift performances and cash discrepancies.</p>
        </div>
        <div style={{ backgroundColor: '#FDFBF7', border: '1px solid #E6D0A9', padding: '8px 16px', borderRadius: '12px', fontWeight: '800', color: '#3B2213', fontSize: '13px' }}>
          Total Records: <span style={{ color: '#B56124', fontSize: '14px' }}>{shiftLogs.length}</span>
        </div>
      </div>

      {loadingLogs ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#B56124', fontWeight: '800', fontSize: '16px', animation: 'pulse 1.5s infinite' }}>Loading drawer history...</p>
        </div>
      ) : shiftLogs.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', backgroundColor: '#FDFBF7', borderRadius: '20px', border: '2px dashed #E6D0A9', marginTop: '10px' }}>
          <div style={{ width: '70px', height: '70px', backgroundColor: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '2px solid #E6D0A9', boxShadow: '0 4px 15px rgba(230, 208, 169, 0.3)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><rect x="8" y="14" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#3B2213', margin: '0 0 8px 0' }}>No Closed Shifts Found</h3>
          <p style={{ color: '#8B5E34', fontWeight: '600', margin: 0, textAlign: 'center', fontSize: '14px' }}>Once a cashier ends their shift, the register details will appear here.</p>
        </div>
      ) : (
        <div className="custom-scrollbar" style={{ maxHeight: '550px', overflowY: 'auto', overflowX: 'auto', borderRadius: '16px', border: '1px solid #E6D0A9', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '100%', position: 'relative' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ textAlign: 'left', backgroundColor: '#3B2213' }}>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#E6D0A9', textTransform: 'uppercase', letterSpacing: '1px' }}>Shift Date</th>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#E6D0A9', textTransform: 'uppercase', letterSpacing: '1px' }}>Branch</th>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#E6D0A9', textTransform: 'uppercase', letterSpacing: '1px' }}>Cashier</th>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#E6D0A9', textTransform: 'uppercase', letterSpacing: '1px' }}>Time Log</th>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#E6D0A9', textTransform: 'uppercase', letterSpacing: '1px' }}>Expected</th>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#E6D0A9', textTransform: 'uppercase', letterSpacing: '1px' }}>Actual Drawer</th>
                <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: '800', color: '#E6D0A9', textTransform: 'uppercase', letterSpacing: '1px' }}>Variance</th>
              </tr>
            </thead>
            <tbody>
              {shiftLogs.map((log, index) => {
                const startDate = new Date(log.start_time);
                const endDate = new Date(log.end_time);
                const shortage = Number(log.shortage);
                
                return (
                  <tr key={log.id} className="table-row-hover" style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: index % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    
                    {/* Notice the data-label attributes injected below! This is what mobile reads. */}
                    <td data-label="Shift Date" style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '700', color: '#4b5563' }}>
                      {startDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    
                    <td data-label="Branch" style={{ padding: '16px 20px' }}>
                      <span style={{ backgroundColor: '#FDFBF7', border: '1px solid #E6D0A9', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', color: '#B56124', whiteSpace: 'nowrap' }}>
                        {getBranchName(log.branch_id)}
                      </span>
                    </td>
                    
                    <td data-label="Cashier" style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '800', color: '#3B2213', whiteSpace: 'nowrap' }}>
                      <div className="mobile-avatar-align" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#E6D0A9', color: '#3B2213', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900' }}>
                          {log.cashier_name.charAt(0).toUpperCase()}
                        </div>
                        {log.cashier_name}
                      </div>
                    </td>
                    
                    <td data-label="Time Log" className="mobile-time-align" style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '600', color: '#6b7280', lineHeight: '1.6', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#10b981', fontWeight: '800' }}>IN:</span> {startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} • {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br/>
                      <span style={{ color: '#ef4444', fontWeight: '800' }}>OUT:</span> {endDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} • {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    
                    <td data-label="Expected" style={{ padding: '16px 20px', fontSize: '15px', fontWeight: '800', color: '#6b7280' }}>
                      {formatMoney(log.expected_cash)}
                    </td>
                    
                    <td data-label="Actual Drawer" style={{ padding: '16px 20px', fontSize: '16px', fontWeight: '900', color: '#3B2213' }}>
                      {formatMoney(log.actual_cash)}
                    </td>
                    
                    <td data-label="Variance" style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '900' }}>
                      {shortage === 0 ? (
                        <span style={{ color: '#059669', background: '#d1fae5', padding: '6px 12px', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          Perfect
                        </span>
                      ) : shortage < 0 ? (
                        <span style={{ color: '#dc2626', background: '#fee2e2', padding: '6px 12px', borderRadius: '8px', border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 19 19 12"></polyline></svg>
                          Short: {formatMoney(Math.abs(shortage))}
                        </span>
                      ) : (
                        <span style={{ color: '#d97706', background: '#fef3c7', padding: '6px 12px', borderRadius: '8px', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 5 5 12"></polyline></svg>
                          Over: {formatMoney(shortage)}
                        </span>
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
  );
}