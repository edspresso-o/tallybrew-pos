import React from 'react';

export default function Inventory({ ingredients, onRestockClick, onAddIngredientClick, onWastageClick }) {
  return (
    
    <div style={{ padding: '20px', paddingTop: '60px', flex: 1, width: '100%', overflowY: 'auto', backgroundColor: '#fff', boxSizing: 'border-box' }}>
      
      {}
      {}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '27px', fontWeight: '800', color: '#111', margin: 0, letterSpacing: '-0.5px' }}>
            Inventory Management
          </h1>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            onClick={onWastageClick} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px solid #ef4444', background: '#fff', color: '#ef4444', fontWeight: '600', cursor: 'pointer', fontSize: '14px', transition: '0.2s', whiteSpace: 'nowrap' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            Record Wastage
          </button>

          <button 
            onClick={() => onRestockClick(null)} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#b85e2b', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '14px', transition: '0.2s', whiteSpace: 'nowrap' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#964a20'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#b85e2b'}
          >
            Manual Restock
          </button>

          <button 
            onClick={onAddIngredientClick} 
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontWeight: '600', cursor: 'pointer', fontSize: '14px', transition: '0.2s', whiteSpace: 'nowrap' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
          >
            Add Item
          </button>
        </div>
      </div>

      {}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', padding: '10px 0' }}>
        
        {}
        <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 20px' }}>
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
            
            <thead>
              <tr>
                <th style={{ padding: '20px 10px', color: '#9ca3af', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6', letterSpacing: '0.5px' }}>ITEM / SKU</th>
                <th style={{ padding: '20px 10px', color: '#9ca3af', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6', letterSpacing: '0.5px' }}>UNIT TYPE</th>
                <th style={{ padding: '20px 10px', color: '#9ca3af', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6', letterSpacing: '0.5px' }}>STOCK LEVEL</th>
                <th style={{ padding: '20px 10px', color: '#9ca3af', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6', letterSpacing: '0.5px' }}>STATUS</th>
                <th style={{ padding: '20px 10px', color: '#9ca3af', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', borderBottom: '1px solid #f3f4f6', letterSpacing: '0.5px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            
            <tbody>
              {ingredients.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontWeight: '600' }}>
                    No items in inventory.
                  </td>
                </tr>
              ) : (
                ingredients.map((item, index) => {
                  // THE FIX: Changed threshold from 100 to 20
                  const isLow = Number(item.stock_qty) <= 20; 
                  const sku = `RAW-${(index + 1).toString().padStart(3, '0')}`;
                  
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '20px 10px' }}>
                        <div style={{ fontWeight: '800', color: '#111', fontSize: '15px', marginBottom: '4px' }}>{item.name}</div>
                        <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>{sku}</div>
                      </td>
                      <td style={{ padding: '20px 10px', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                        {item.unit || 'units'}
                      </td>
                      <td style={{ padding: '20px 10px' }}>
                        <span style={{ fontWeight: '800', fontSize: '15px', color: isLow ? '#ef4444' : '#111' }}>
                          {item.stock_qty} <span style={{ fontSize: '13px', color: isLow ? '#ef4444' : '#6b7280', fontWeight: '600' }}>{item.unit}</span>
                        </span>
                      </td>
                      <td style={{ padding: '20px 10px' }}>
                        {isLow ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef2f2', color: '#ef4444', padding: '6px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            CRITICAL LOW
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#10b981', padding: '6px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            SUFFICIENT
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '20px 10px', textAlign: 'right' }}>
                        <button 
                          onClick={() => onRestockClick({ ...item, sku })}
                          title="Restock Item"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '8px', transition: 'color 0.2s' }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#111'}
                          onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="17 1 21 5 17 9"></polyline>
                            <line x1="3" y1="5" x2="21" y2="5"></line>
                            <polyline points="7 23 3 19 7 15"></polyline>
                            <line x1="21" y1="19" x2="3" y2="19"></line>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}