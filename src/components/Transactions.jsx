import React from 'react';

export default function Transactions({ sales, onVoidSale, activeCashier }) {
 
  const sortedSales = [...sales].reverse();

  return (
    
    <div className="transactions-page" style={{ padding: '20px', paddingTop: '50px', width: '100%', boxSizing: 'border-box' }}>
      
      <div className="transactions-header" style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#3B2213', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>Transaction History</h2>
        <p style={{ color: '#B56124', fontSize: '15px', fontWeight: '700', margin: 0 }}>View and manage all processed orders.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {sortedSales.length === 0 ? (
          <p style={{ color: '#9ca3af', fontWeight: '600', textAlign: 'center', marginTop: '40px' }}>No transactions yet.</p>
        ) : (
          sortedSales.map(sale => (
            <div key={sale.id} style={{ 
              backgroundColor: '#FDFBF7', 
              border: '2px solid #e5e7eb', 
              borderRadius: '16px', 
              padding: '16px',
              display: 'flex',
              flexWrap: 'wrap', 
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '15px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              
              {}
              <div style={{ flex: '1 1 220px', minWidth: 0 }}> 
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ backgroundColor: '#fef08a', color: '#d97706', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px' }}>
                    {sale.payment_method?.toUpperCase() || 'CASH'}
                  </span>
                  <span style={{ color: '#b85e2b', fontSize: '13px', fontWeight: '800' }}>
                    {new Date(sale.created_at).toLocaleString([], { month: 'numeric', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ color: '#111', fontSize: '14px', fontWeight: '700', lineHeight: '1.4', wordWrap: 'break-word' }}>
                  {sale.items_summary}
                </div>
              </div>

              {}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', flex: '0 0 auto' }}>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#3B2213' }}>
                  ₱{Number(sale.total_amount).toFixed(2)}
                </div>
                <button 
                  onClick={() => onVoidSale(sale)}
                  style={{ 
                    backgroundColor: '#fef2f2', 
                    color: '#ef4444', 
                    border: '1px solid #fecaca', 
                    padding: '10px 16px', 
                    borderRadius: '10px', 
                    fontWeight: '800', 
                    fontSize: '13px', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
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