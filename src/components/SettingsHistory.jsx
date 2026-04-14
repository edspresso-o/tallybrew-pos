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
    <div className="history-page-wrapper">
      
      {/* BULLETPROOF CSS INJECTIONS */}
      <style>{`
        /* Base Desktop Styles */
        .history-page-wrapper {
          background: #fff;
          border-radius: 24px;
          padding: clamp(20px, 4vw, 35px);
          box-shadow: 0 10px 30px rgba(59, 34, 19, 0.04);
          border: 1px solid #f3f4f6;
          animation: fadeIn 0.4s ease-out;
          text-align: left;
          width: 100%;
          box-sizing: border-box;
        }

        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 25px;
          border-bottom: 2px solid #E6D0A9;
          padding-bottom: 15px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .custom-scrollbar {
          max-height: 550px;
          overflow-y: auto;
          overflow-x: auto;
          border-radius: 16px;
          border: 1px solid #E6D0A9;
          box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }

        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #FDFBF7; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E6D0A9; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #B56124; }

        .responsive-table { width: 100%; border-collapse: collapse; min-width: 100%; }
        .responsive-table th { padding: 16px 20px; font-size: 12px; font-weight: 800; color: #E6D0A9; text-transform: uppercase; letter-spacing: 1px; text-align: left; background-color: #3B2213; position: sticky; top: 0; z-index: 10; }
        .responsive-table td { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; white-space: nowrap; }

        .table-row-hover { transition: all 0.2s ease; }
        .table-row-hover:hover { background-color: #FDFBF7 !important; transform: scale(1.002); box-shadow: 0 4px 12px rgba(59, 34, 19, 0.05); z-index: 2; position: relative; }

        .td-content { display: flex; align-items: center; gap: 8px; }
        .time-log-content { display: flex; flex-direction: column; gap: 4px; }

        /* --- THE MAGIC MOBILE FIX --- */
        @media screen and (max-width: 768px) {
          
          /* Pushes everything below the hamburger menu! */
          .history-page-wrapper {
            padding: 75px 16px 20px 16px !important; 
          }

          .header-container { flex-direction: column !important; align-items: flex-start !important; gap: 15px !important; }

          /* Allow mobile to scroll naturally instead of being trapped in a box */
          .custom-scrollbar {
            max-height: none !important; 
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          /* Force table to act like standard divs */
          .responsive-table, .responsive-table tbody, .responsive-table tr, .responsive-table td {
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .responsive-table thead { display: none !important; }

          /* Style the Row as a Card */
          .table-row-hover {
            margin-bottom: 20px !important;
            border: 2px solid #E6D0A9 !important;
            border-radius: 16px !important;
            padding: 16px !important;
            background-color: #fff !important;
            transform: none !important; /* Disables the weird hover scale on phones */
            box-shadow: 0 4px 10px rgba(0,0,0,0.02) !important;
          }

          /* Splits the TD into Left (Label) and Right (Data) */
          .responsive-table td {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 12px 0 !important;
            border-bottom: 1px dashed #e5e7eb !important;
            white-space: normal !important; /* CRITICAL: Lets text wrap instead of breaking the card! */
            text-align: right !important;
            gap: 15px !important;
          }
          .responsive-table td:last-child { border-bottom: none !important; padding-bottom: 0 !important; }
          .responsive-table td:first-child { padding-top: 0 !important; }

          /* Injects the Mobile Labels */
          .responsive-table td::before {
            content: attr(data-label);
            font-weight: 800;
            font-size: 11px;
            color: #B56124;
            text-transform: uppercase;
            text-align: left;
            flex-shrink: 0;
            width: 35%; /* Ensures all labels line up perfectly on the left */
          }

          /* Forces all data into the right column */
          .td-content { width: 65%; justify-content: flex-end; flex-wrap: wrap; }
          .time-log-content { align-items: flex-end; text-align: right; }
        }
      `}</style>

      <div className="header-container">
        <div>
          <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: '900', color: '#3B2213', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Shift Logs & Drawer Records</h2>
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
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><rect x="8" y="14" width="8" height="4" rx="1" ry="1"></rect></svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#3B2213', margin: '0 0 8px 0' }}>No Closed Shifts Found</h3>
          <p style={{ color: '#8B5E34', fontWeight: '600', margin: 0, textAlign: 'center', fontSize: '14px' }}>Once a cashier ends their shift, the register details will appear here.</p>
        </div>
      ) : (
        <div className="custom-scrollbar">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Shift Date</th>
                <th>Branch</th>
                <th>Cashier</th>
                <th>Time Log</th>
                <th>Expected</th>
                <th>Actual Drawer</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {shiftLogs.map((log, index) => {
                const startDate = new Date(log.start_time);
                const endDate = new Date(log.end_time);
                const shortage = Number(log.shortage);

                return (
                  <tr key={log.id} className="table-row-hover" style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#fafbfc' }}>

                    <td data-label="Shift Date" style={{ fontSize: '14px', fontWeight: '700', color: '#4b5563' }}>
                      <div className="td-content">
                        {startDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>

                    <td data-label="Branch">
                      <div className="td-content">
                        <span style={{ backgroundColor: '#FDFBF7', border: '1px solid #E6D0A9', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', color: '#B56124' }}>
                          {getBranchName(log.branch_id)}
                        </span>
                      </div>
                    </td>

                    <td data-label="Cashier" style={{ fontSize: '14px', fontWeight: '800', color: '#3B2213' }}>
                      <div className="td-content">
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#E6D0A9', color: '#3B2213', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', flexShrink: 0 }}>
                          {log.cashier_name.charAt(0).toUpperCase()}
                        </div>
                        {log.cashier_name}
                      </div>
                    </td>

                    <td data-label="Time Log" style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', lineHeight: '1.6' }}>
                      <div className="td-content time-log-content">
                        <div><span style={{ color: '#10b981', fontWeight: '800' }}>IN:</span> {startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} • {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div><span style={{ color: '#ef4444', fontWeight: '800' }}>OUT:</span> {endDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} • {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </td>

                    <td data-label="Expected" style={{ fontSize: '15px', fontWeight: '800', color: '#6b7280' }}>
                      <div className="td-content">
                        {formatMoney(log.expected_cash)}
                      </div>
                    </td>

                    <td data-label="Actual Drawer" style={{ fontSize: '16px', fontWeight: '900', color: '#3B2213' }}>
                      <div className="td-content">
                        {formatMoney(log.actual_cash)}
                      </div>
                    </td>

                    <td data-label="Variance" style={{ fontSize: '14px', fontWeight: '900' }}>
                      <div className="td-content">
                        {shortage === 0 ? (
                          <span style={{ color: '#059669', background: '#d1fae5', padding: '6px 12px', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Perfect
                          </span>
                        ) : shortage < 0 ? (
                          <span style={{ color: '#dc2626', background: '#fee2e2', padding: '6px 12px', borderRadius: '8px', border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 19 19 12"></polyline></svg>
                            Short: {formatMoney(Math.abs(shortage))}
                          </span>
                        ) : (
                          <span style={{ color: '#d97706', background: '#fef3c7', padding: '6px 12px', borderRadius: '8px', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 5 5 12"></polyline></svg>
                            Over: {formatMoney(shortage)}
                          </span>
                        )}
                      </div>
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