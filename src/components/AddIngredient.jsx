import React, { useState } from 'react';

export default function AddIngredient({ onClose, addIngredient }) {
  const [formData, setFormData] = useState({
    name: '',
    stock_qty: '',
    unit: 'g' // default unit
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addIngredient(formData);
  };

  return (
    <div className="popup-overlay">
      <div className="add-product-popup">
        <div className="popup-header">
          <h2>Add Raw Ingredient</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form className="popup-form" onSubmit={handleSubmit}>
          <label>Ingredient Name</label>
          <input 
            type="text" 
            className="pill" 
            placeholder="e.g., Espresso Beans" 
            required 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label>Initial Stock</label>
              <input 
                type="number" 
                className="pill" 
                placeholder="0" 
                required 
                value={formData.stock_qty}
                onChange={(e) => setFormData({...formData, stock_qty: e.target.value})}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Unit of Measurement</label>
              <select 
                className="pill" 
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
              >
                <option value="g">Grams (g)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="pcs">Pieces (pcs)</option>
              </select>
            </div>
          </div>

          <button type="submit" className="save-product-btn">Save Ingredient</button>
        </form>
      </div>
    </div>
  );
}