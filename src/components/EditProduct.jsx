import { useState, useEffect } from 'react';

export default function EditProduct({ isOpen, onClose, product, onUpdate }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Hot Coffee',
    recipe: '',
    stock_qty: 0, // Added stock state
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price || '',
        category: product.category || 'Hot Coffee',
        recipe: product.recipe || '',
        stock_qty: product.stock_qty || 0, // Initialize with current stock
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(product.id, formData);
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="add-product-popup" style={{ maxWidth: '600px', width: '90%' }}>
        <div className="popup-header">
          <h2>Edit Product: {product?.name}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="popup-form">
          <div className="form-group form-row-full">
            <label>PRODUCT NAME</label>
            <input type="text" name="name" className="pill" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label>PRICE (₱)</label>
              <input type="number" name="price" className="pill" value={formData.price} onChange={handleChange} required />
            </div>
            <div style={{ flex: 1 }}>
              <label>STOCK QUANTITY</label> {/* NEW STOCK INPUT */}
              <input 
                type="number" 
                name="stock_qty" 
                className="pill" 
                value={formData.stock_qty} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group form-row-full">
            <label>CATEGORY</label>
            <select name="category" className="pill" value={formData.category} onChange={handleChange}>
              <option>Hot Coffee</option>
              <option>Iced Coffee</option>
              <option>Non-Coffee</option>
              <option>Frappe</option>
              <option>Snacks</option>
              <option>Rice Meals</option>
            </select>
          </div>

          <div className="form-group form-row-full">
            <label>RECIPE / INGREDIENTS</label>
            <textarea name="recipe" value={formData.recipe} onChange={handleChange} rows="4" style={{ width: '100%' }}></textarea>
          </div>

          <button type="submit" className="save-product-btn" style={{ backgroundColor: '#b85e2b', color: 'white', marginTop: '15px' }}>
            Update Product & Stock
          </button>
        </form>
      </div>
    </div>
  );
}