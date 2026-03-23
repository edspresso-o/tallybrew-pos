import React, { useState, useEffect } from 'react';

export default function ManualRestock({ isOpen, onClose, menuItems, onRestock, preselectedItem }) {
  const [selectedItem, setSelectedItem] = useState('');
  const [qty, setQty] = useState('');
  const [invoice, setInvoice] = useState('');

  useEffect(() => {
    if (preselectedItem) {
      setSelectedItem(preselectedItem.id);
      if (preselectedItem.sku) setInvoice(preselectedItem.sku);
    }
  }, [preselectedItem]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const item = menuItems.find(i => i.id.toString() === selectedItem.toString());
    if (!item || !qty) return;
    const newStock = Number(item.stock_qty || 0) + Number(qty);
    onRestock(item.id, newStock, invoice);
  };

  if (!isOpen) return null;

  return (
    
    <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10005, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '30px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#111' }}>Restock Inventory</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#9ca3af', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>Select Item</label>
            <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', fontWeight: '600', outline: 'none' }}>
              <option value="" disabled>-- Choose an item --</option>
              {menuItems.map(item => (
                <option key={item.id} value={item.id}>{item.name} ({item.stock_qty} {item.unit})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>Qty to Add</label>
              <input type="number" value={qty} onChange={e => setQty(e.target.value)} required placeholder="e.g. 50" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', fontWeight: '600', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              {}
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Supplier / SKU</label>
              <input type="text" value={invoice} onChange={e => setInvoice(e.target.value)} placeholder="#INV-001" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', fontWeight: '600', boxSizing: 'border-box', outline: 'none' }} />
            </div>
          </div>

          <button type="submit" disabled={!selectedItem || !qty} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: (!selectedItem || !qty) ? '#e5e7eb' : '#b85e2b', color: (!selectedItem || !qty) ? '#9ca3af' : '#fff', fontWeight: '900', fontSize: '16px', cursor: (!selectedItem || !qty) ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
            CONFIRM RESTOCK
          </button>
        </form>

      </div>
    </div>
  );
}