import React from 'react';

export default function Cart({ cart, updateQty, total, handleCheckout, discount, onOpenDiscount }) {
  const safeTotal = total || 0; 
  const discountAmount = safeTotal * (discount?.rate || 0);
  const totalAmount = safeTotal - discountAmount;

  return (
  
    <div className="cart-panel" style={{ flexGrow: 1, width: '100%', minHeight: '100%', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      
      {}
      <div className="cart-header" style={{ flexShrink: 0, padding: '20px', borderBottom: '2px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b85e2b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#111', letterSpacing: '-0.5px' }}>Current Order</h2>
      </div>
      
      {}
      {}
      <div className="cart-items" style={{ flexGrow: 1, overflowY: 'auto', padding: '15px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '40px', fontWeight: '600', fontSize: '15px' }}>Cart is empty</div>
        ) : (
          cart.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', width: '100%' }}>
              
              <div style={{ flex: '0 0 45px', height: '45px', borderRadius: '10px', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              
              <div style={{ flex: '1 1 auto', minWidth: 0, fontWeight: '800', fontSize: '13px', color: '#111', lineHeight: '1.2', wordBreak: 'break-word', paddingRight: '5px' }}>
                {item.name}
              </div>

              <div style={{ flex: '0 0 auto', display: 'flex', border: '2px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', height: '32px' }}>
                <button onClick={() => updateQty(item.id, -1)} style={{ width: '30px', backgroundColor: '#f9fafb', color: '#4b5563', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <div style={{ width: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', fontSize: '13px', fontWeight: '800', color: '#111', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>{item.qty}</div>
                <button onClick={() => updateQty(item.id, 1)} style={{ width: '30px', backgroundColor: '#f9fafb', color: '#4b5563', border: 'none', cursor: 'pointer', fontWeight: '900', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>

              <div style={{ flex: '0 0 auto', minWidth: '45px', fontWeight: '900', fontSize: '14px', color: '#111', textAlign: 'right' }}>
                ₱ {(item.price * item.qty).toFixed(0)}
              </div>
            </div>
          ))
        )}
      </div>

      {}
      <div className="cart-summary" style={{ flexShrink: 0, padding: '20px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))', borderTop: '2px solid #e5e7eb', backgroundColor: '#fff', boxShadow: '0 -4px 10px rgba(0,0,0,0.02)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#6b7280', fontSize: '14px', fontWeight: '600', padding: '0 4px' }}>
          <span>Subtotal</span>
          <span>₱ {safeTotal.toFixed(2)}</span>
        </div>
        
        <div 
          onClick={onOpenDiscount}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '15px', 
            color: discountAmount > 0 ? '#ef4444' : '#9ca3af', 
            fontSize: '14px', 
            fontWeight: '700',
            cursor: 'pointer',
            padding: '12px 10px',
            backgroundColor: discountAmount > 0 ? '#fef2f2' : '#f9fafb',
            border: discountAmount > 0 ? '2px dashed #ef4444' : '2px dashed #e5e7eb',
            borderRadius: '10px',
            transition: 'all 0.2s'
          }}
        >
          <span>Discount {discount?.rate > 0 ? `(${discount.label})` : ' (Tap to add)'}</span>
          <span>- ₱ {discountAmount.toFixed(2)}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '20px', color: '#111', marginBottom: '20px', borderTop: '2px dashed #e5e7eb', paddingTop: '15px', paddingLeft: '4px', paddingRight: '4px', letterSpacing: '-0.5px' }}>
          <span>Total Amount</span>
          <span>₱ {totalAmount.toFixed(2)}</span>
        </div>

        <button 
          onClick={handleCheckout} 
          disabled={cart.length === 0}
          style={{ 
            width: '100%', 
            padding: '18px', 
            backgroundColor: cart.length > 0 ? '#b85e2b' : '#e5e7eb', 
            color: cart.length > 0 ? '#fff' : '#9ca3af', 
            border: 'none', 
            borderRadius: '12px', 
            cursor: cart.length > 0 ? 'pointer' : 'not-allowed', 
            fontWeight: '900',
            fontSize: '16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: cart.length > 0 ? '0 10px 15px -3px rgba(184, 94, 43, 0.3)' : 'none'
          }}
        >
          PROCESS PAYMENT <span style={{ fontSize: '22px', lineHeight: '1' }}>›</span>
        </button>
      </div>
    </div>
  );
}