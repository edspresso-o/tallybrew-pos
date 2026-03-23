import React, { useState } from 'react';

export default function RecordWastage({ onClose, inventory, onRecordWastage }) {
  const [selectedItem, setSelectedItem] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedItem || !amount) return;
    onRecordWastage(selectedItem, amount, reason);
  };

  return (
    
    <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10005, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '30px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#ef4444' }}>Record Wastage</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#9ca3af', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>Select Ingredient</label>
            <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', fontWeight: '600', outline: 'none' }}>
              <option value="" disabled>Choose an ingredient...</option>
              {inventory.map(item => (
                <option key={item.id} value={item.id}>{item.name} ({item.stock_qty} {item.unit} left)</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>Amount Wasted</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="e.g. 50" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', fontWeight: '600', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>Reason (Optional)</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Spilled, Expired, Quality Issue" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', fontWeight: '600', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <button type="submit" disabled={!selectedItem || !amount} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: (!selectedItem || !amount) ? '#e5e7eb' : '#ef4444', color: (!selectedItem || !amount) ? '#9ca3af' : '#fff', fontWeight: '900', fontSize: '16px', cursor: (!selectedItem || !amount) ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
            Confirm Wastage
          </button>
        </form>
      </div>
    </div>
  );
}