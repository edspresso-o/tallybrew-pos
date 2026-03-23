import React, { useState } from 'react';

export default function AddIngredient({ onClose, addIngredient }) {
  const [name, setName] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('g');

  const handleSubmit = (e) => {
    e.preventDefault();
    addIngredient({ name, stock_qty: stock, unit });
  };

  return (
    
    <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10005, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '30px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#111' }}>Add Raw Ingredient</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#9ca3af', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>Ingredient Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g., Espresso Beans" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', fontWeight: '600', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>Initial Stock</label>
              <input type="number" value={stock} onChange={e => setStock(e.target.value)} required placeholder="0" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', fontWeight: '600', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              {}
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Unit Type</label>
              <select value={unit} onChange={e => setUnit(e.target.value)} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '15px', fontWeight: '600', outline: 'none' }}>
                <option value="g">Grams (g)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="pcs">Pieces (pcs)</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={!name || !stock} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: (!name || !stock) ? '#e5e7eb' : '#b85e2b', color: (!name || !stock) ? '#9ca3af' : '#fff', fontWeight: '900', fontSize: '16px', cursor: (!name || !stock) ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
            Save Ingredient
          </button>
        </form>

      </div>
    </div>
  );
}