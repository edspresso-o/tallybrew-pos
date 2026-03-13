import React, { useState } from 'react';

export default function RecordWastage({ onClose, inventory, onRecordWastage }) {
  const [selectedIng, setSelectedIng] = useState('');
  const [wasteAmount, setWasteAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedIng && wasteAmount) {
      onRecordWastage(selectedIng, wasteAmount);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="add-product-popup">
        <div className="popup-header">
          <h2 style={{ color: '#ef4444' }}>Record Wastage</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form className="popup-form" onSubmit={handleSubmit}>
          
          <label>Select Ingredient</label>
          <select className="pill" required value={selectedIng} onChange={(e) => setSelectedIng(e.target.value)}>
            <option value="">Choose an ingredient...</option>
            {inventory.map(ing => (
              <option key={ing.id} value={ing.id}>
                {ing.name} (Current: {ing.stock_qty} {ing.unit})
              </option>
            ))}
          </select>

          <label>Amount Wasted</label>
          <input 
            type="number" 
            className="pill" 
            placeholder="e.g. 50" 
            required 
            value={wasteAmount} 
            onChange={(e) => setWasteAmount(e.target.value)} 
          />

          <label>Reason (Optional)</label>
          <input 
            type="text" 
            className="pill" 
            placeholder="e.g. Spilled, Expired, Quality Issue" 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <button type="submit" className="save-product-btn" style={{ backgroundColor: '#ef4444' }}>
            Confirm Wastage
          </button>
        </form>
      </div>
    </div>
  );
}