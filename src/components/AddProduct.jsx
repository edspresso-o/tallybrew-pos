import React, { useState } from 'react';

export default function AddProduct({ onClose, addProduct, ingredients, categories }) {
  // Default to the first category in the list (e.g., 'Hot Coffee')
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    category: categories ? categories[0] : 'Hot Coffee' 
  });
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [recipe, setRecipe] = useState([]);
  const [selectedIng, setSelectedIng] = useState('');
  const [ingQty, setIngQty] = useState('');

  const handleAddIngredientToRecipe = () => {
    if (selectedIng && ingQty) {
      const ingDetails = ingredients.find(i => i.id.toString() === selectedIng.toString());
      
      if (ingDetails) {
        setRecipe([...recipe, { 
          id: ingDetails.id, 
          name: ingDetails.name,
          qty: Number(ingQty), 
          unit: ingDetails.unit 
        }]);
        setIngQty('');
      }
    }
  };

  const removeIngredient = (indexToRemove) => {
    setRecipe(recipe.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const productToSave = {
      ...formData,
      recipe: JSON.stringify(recipe) 
    };
    addProduct(productToSave, selectedFile);
  };

  return (
    <div className="popup-overlay">
      <div className="add-product-popup" style={{ width: '500px' }}>
        <div className="popup-header">
          <h2>Add New Menu Item</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form className="popup-form" onSubmit={handleSubmit}>
          
          <label>Product Name</label>
          <input 
            type="text" 
            className="pill" 
            placeholder="e.g. Vanilla Frappe"
            required 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label>Price (₱)</label>
              <input 
                type="number" 
                className="pill" 
                placeholder="0.00"
                required 
                value={formData.price} 
                onChange={(e) => setFormData({...formData, price: e.target.value})} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Category</label>
              <select 
                className="pill" 
                value={formData.category} 
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {/* DYNAMIC CATEGORIES: Pulls exactly what you have in App.jsx */}
                {categories && categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="recipe-builder-section" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
            <label style={{ color: '#b85e2b' }}>Recipe (Bill of Materials)</label>
            
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '15px' }}>
              {recipe.map((r, idx) => (
                <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 600 }}>{r.name}</span>
                  <span>
                    <span style={{ color: '#b85e2b', fontWeight: 800, marginRight: '10px' }}>{r.qty} {r.unit}</span>
                    <span style={{ cursor: 'pointer', color: '#ef4444', fontWeight: 'bold' }} onClick={() => removeIngredient(idx)}>X</span>
                  </span>
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', gap: '8px' }}>
              <select className="pill" style={{ flex: 2, marginBottom: 0 }} value={selectedIng} onChange={(e) => setSelectedIng(e.target.value)}>
                <option value="">Select Ingredient...</option>
                {ingredients.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                ))}
              </select>
              <input type="number" className="pill" placeholder="Qty" style={{ flex: 1, marginBottom: 0 }} value={ingQty} onChange={(e) => setIngQty(e.target.value)} />
              <button type="button" className="export-btn" style={{ padding: '0 15px' }} onClick={handleAddIngredientToRecipe}>Add</button>
            </div>
          </div>

          <label>Product Photo (Optional)</label>
          {}
          <input 
            type="file" 
            accept="image/*" 
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '2px dashed #d1cbc7', 
              borderRadius: '8px', 
              backgroundColor: '#fdfbf9', 
              color: '#555',
              cursor: 'pointer',
              marginBottom: '20px',
              fontFamily: 'inherit',
              fontSize: '14px'
            }} 
            onChange={(e) => setSelectedFile(e.target.files[0])} 
          />

          <button type="submit" className="save-product-btn">Save Menu Item</button>
        </form>
      </div>
    </div>
  );
}