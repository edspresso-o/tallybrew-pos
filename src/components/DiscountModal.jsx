import React from 'react';

export default function DiscountModal({ onClose, applyDiscount, currentDiscount }) {

  const discountOptions = [
    { label: 'No Discount', rate: 0 },
    { label: 'Senior Citizen', rate: 0.20 }, // 20%
    { label: 'PWD', rate: 0.20 }, // 20%
    { label: 'Store Promo', rate: 0.10 }, // 10%
    { label: 'Employee', rate: 0.50 } // 50%
  ];

  return (
    <div className="popup-overlay">
      <div className="add-product-popup" style={{ width: '400px' }}>
        <div className="popup-header">
          <h2>Apply Discount</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div style={{ padding: '20px' }}>
          
          {discountOptions.map((opt, idx) => {
            const isActive = currentDiscount?.label === opt.label;
            
            return (
              <button
                key={idx}
                onClick={() => { 
                  applyDiscount(opt); 
                  onClose(); 
                }}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  marginBottom: '10px',
                  borderRadius: '12px',
                  border: isActive ? '2px solid #b85e2b' : '1px solid #ddd',
                  backgroundColor: isActive ? '#fffaf5' : '#fff',
                  color: isActive ? '#b85e2b' : '#333',
                  fontWeight: '700',
                  fontSize: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <span>
                  {opt.label} 
                  {opt.rate > 0 && <span style={{ opacity: 0.6, fontSize: '14px', marginLeft: '8px' }}>({opt.rate * 100}%)</span>}
                </span>
                
                {}
                {isActive && (
                  <span style={{ backgroundColor: '#b85e2b', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px' }}>
                    ✓
                  </span>
                )}
              </button>
            )
          })}
          
        </div>
      </div>
    </div>
  );
}