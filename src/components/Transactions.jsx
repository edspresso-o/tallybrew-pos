import React from 'react';

export default function Transactions({ sales, onVoidSale, activeCashier }) {
  const formatMoney = (amount) => `₱${Number(amount).toFixed(2)}`;

  // Sort sales so the newest ones are always at the top
  const sortedSales = [...sales].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', boxSizing: 'border-box', textAlign: 'left' }}>
       
       <div style={{ marginBottom: '30px', textAlign: 'left' }}>
         <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#3B2213', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>Transaction History</h2>
         <p style={{ color: '#B56124', fontWeight: '700', margin: 0 }}>View and manage all processed orders.</p>
       </div>
       
       <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {sortedSales.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FDFBF7', borderRadius: '24px', border: '2px dashed #E6D0A9' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E6D0A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '15px'}}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                <p style={{ color: '#9ca3af', fontWeight: '700', fontSize: '16px', margin: 0 }}>No transactions recorded yet.</p>
             </div>
          ) : (
             sortedSales.map(sale => (
                <div key={sale.id} style={{ background: '#FDFBF7', border: '1px solid #E6D0A9', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(59,34,19,0.05)', animation: 'popIn 0.3s' }}>
                   
                   {/* Left Side: Details aligned left */}
                   <div style={{ flex: 1, paddingRight: '20px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                         <span style={{ background: sale.payment_method === 'GCash' ? '#e0e7ff' : '#fef3c7', color: sale.payment_method === 'GCash' ? '#059669' : '#d97706', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                           {sale.payment_method}
                         </span>
                         <span style={{ fontSize: '13px', fontWeight: '800', color: '#B56124' }}>
                            {new Date(sale.created_at).toLocaleDateString()} • {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#3B2213', lineHeight: '1.4' }}>
                         {sale.items_summary}
                      </div>
                   </div>
                   
                   {/* Right Side: Total and Void Button */}
                   <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#3B2213', textAlign: 'right' }}>
                         {formatMoney(sale.total_amount)}
                      </div>
                      <button 
                         onClick={() => onVoidSale(sale)}
                         style={{ padding: '12px 16px', borderRadius: '12px', border: 'none', background: '#fef2f2', color: '#dc2626', fontWeight: '900', fontSize: '14px', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(220, 38, 38, 0.15)' }}
                      >
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
                         Void
                      </button>
                   </div>
                </div>
             ))
          )}
       </div>
    </div>
  );
}