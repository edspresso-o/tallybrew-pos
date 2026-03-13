import React, { useState, useEffect } from 'react';

export default function ManualRestock({ isOpen, onClose, menuItems, onRestock, preselectedItem }) {
  const [selectedId, setSelectedId] = useState('');
  const [addQty, setAddQty] = useState('');
  const [invoice, setInvoice] = useState('');

  useEffect(() => {
    if (preselectedItem) {
      setSelectedId(String(preselectedItem.id)); 
      
      // --- THIS LINE IS UPDATED: Auto-fill the invoice box with the SKU! ---
      setInvoice(preselectedItem.sku || ''); 
      
    } else {
      setSelectedId('');
      setInvoice('');
    }
    setAddQty('');
  }, [preselectedItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const item = menuItems.find(i => String(i.id) === String(selectedId));
    
    if (!item || !addQty) {
      alert("Please select an item and enter a quantity.");
      return;
    }
    
    const newTotal = Number(item.stock_qty) + Number(addQty);
    
    onRestock(selectedId, newTotal, invoice);
  };

  return (
    <div className="popup-overlay" style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
      <div className="add-product-popup" style={{ width: '400px', borderRadius: '20px', padding: '30px', backgroundColor: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#111' }}>Restock Inventory</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#aaa', cursor: 'pointer' }}>&times;</button>
        </div>

        {/* Item Selection */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>Select Item</label>
          <select 
            value={selectedId} 
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px', fontWeight: '700', outline: 'none', backgroundColor: '#fafafa' }}
          >
            <option value="" disabled>-- Choose an item --</option>
            {menuItems.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} (Current: {item.stock_qty} {item.unit})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          {/* Quantity to Add */}
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>Qty to Add</label>
            <input 
              type="number" 
              placeholder="e.g. 50" 
              value={addQty} 
              onChange={(e) => setAddQty(e.target.value)}
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', fontWeight: '800', outline: 'none', backgroundColor: '#fafafa' }}
              autoFocus
            />
          </div>

          {/* Supplier Invoice */}
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>Supplier Invoice / SKU</label>
            <input 
              type="text" 
              placeholder="#INV-001" 
              value={invoice} 
              onChange={(e) => setInvoice(e.target.value)}
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px', fontWeight: '700', outline: 'none', backgroundColor: '#fafafa', color: '#b85e2b' }}
            />
          </div>
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={!selectedId || !addQty}
          style={{ width: '100%', padding: '16px', borderRadius: '10px', border: 'none', backgroundColor: (!selectedId || !addQty) ? '#e5e7eb' : '#b85e2b', color: '#fff', fontSize: '14px', fontWeight: '800', cursor: (!selectedId || !addQty) ? 'not-allowed' : 'pointer', marginTop: '10px', transition: '0.2s' }}
        >
          CONFIRM RESTOCK
        </button>
      </div>
    </div>
  );
}