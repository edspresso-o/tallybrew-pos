import React, { useState } from 'react';

export default function Menu({ 
  menuItems, 
  categories, 
  activeCategory, 
  setActiveCategory, 
  addToCart, 
  onManageClick, 
  deleteProduct,
  inventory = [] // We only need your inventory now!
}) {
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  const filteredItems = activeCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  // --- THE UPDATED BOUNCER LOGIC ---
  const isDrinkAvailable = (item) => {
    // 1. Check if this specific product has a JSON recipe attached to it
    if (item.recipe && item.recipe.startsWith('[')) {
      try {
        const recipeList = JSON.parse(item.recipe);
        
        // 2. Loop through every ingredient needed for this drink
        for (let req of recipeList) {
          // Find the ingredient in your live inventory
          const stockItem = inventory.find(i => i.id === req.id);
          
          // 3. If the ingredient doesn't exist, OR the stock_qty is less than what the drink needs, LOCK IT!
          if (!stockItem || Number(stockItem.stock_qty) < Number(req.qty)) {
            return false;
          }
        }
      } catch (error) {
        console.error("Could not read recipe for", item.name);
      }
    }
    
    // If it has no recipe (like a generic snack) or all ingredients are in stock, allow it!
    return true; 
  };
  // ---------------------------------

  return (
    <div className="main-menu" style={{ padding: '20px', flex: 1, width: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
      
      {/* HEADER AREA */}
      <div className="menu-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '15px', marginBottom: '25px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#000', letterSpacing: '-1px' }}>Menu</h1>
          <span 
            onClick={onManageClick}
            style={{ fontSize: '18px', color: '#9ca3af', fontWeight: '800', cursor: 'pointer', transition: 'color 0.2s', letterSpacing: '-0.5px' }}
            onMouseOver={(e) => e.target.style.color = '#6b7280'}
            onMouseOut={(e) => e.target.style.color = '#9ca3af'}
          >
            Manage
          </span>
        </div>

        <button
          onClick={() => setIsDeleteMode(!isDeleteMode)}
          style={{ padding: '10px 16px', backgroundColor: isDeleteMode ? '#ef4444' : '#fff', color: isDeleteMode ? '#fff' : '#ef4444', border: '2px solid #ef4444', borderRadius: '10px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isDeleteMode ? '0 4px 10px rgba(239,68,68,0.3)' : 'none', whiteSpace: 'nowrap' }}
        >
          {isDeleteMode ? 'Done Removing' : 'Remove Items'}
        </button>
      </div>

      {/* CATEGORIES */}
      <div className="category-pills" style={{ display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '10px', WebkitOverflowScrolling: 'touch' }}>
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
            style={{ padding: '10px 20px', borderRadius: '20px', border: activeCategory === cat ? '2px solid #b85e2b' : '2px solid #e5e7eb', background: activeCategory === cat ? '#b85e2b' : '#fff', color: activeCategory === cat ? '#fff' : '#4b5563', fontWeight: '700', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s ease', boxShadow: activeCategory === cat ? '0 4px 10px rgba(184, 94, 43, 0.2)' : 'none' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PRODUCT GRID */}
      <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        {filteredItems.map(item => {
          
          // Check stock before rendering the card!
          const available = isDrinkAvailable(item);

          return (
            <div 
              key={item.id} 
              className="product-card" 
              onClick={() => {
                if (isDeleteMode) {
                  deleteProduct(item.id);
                } else if (available) {
                  addToCart(item); // Only allow adding to cart if ingredients are in stock!
                }
              }}
              style={{
                background: available ? '#fff' : '#f3f4f6',
                borderRadius: '16px',
                padding: '12px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                cursor: (available || isDeleteMode) ? 'pointer' : 'not-allowed',
                border: isDeleteMode ? '2px dashed #ef4444' : '2px solid transparent',
                position: 'relative',
                transition: 'transform 0.1s, box-shadow 0.2s',
                opacity: (available || isDeleteMode) ? 1 : 0.6,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                pointerEvents: 'auto' 
              }}
              onMouseDown={(e) => (!isDeleteMode && available) && (e.currentTarget.style.transform = 'scale(0.96)')}
              onMouseUp={(e) => (!isDeleteMode && available) && (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (!isDeleteMode && available) && (e.currentTarget.style.transform = 'scale(1)')}
            >
              
              {!available && !isDeleteMode && (
                <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '12px', zIndex: 5, boxShadow: '0 4px 10px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
                  Out of Stock
                </div>
              )}

              {isDeleteMode && (
                <div style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ef4444', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '20px', boxShadow: '0 4px 10px rgba(239,68,68,0.4)', zIndex: 10 }}>−</div>
              )}

              <div className="product-image" style={{ width: '100%', height: '120px', backgroundColor: '#f9fafb', borderRadius: '12px', marginBottom: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px', boxSizing: 'border-box', filter: available ? 'none' : 'grayscale(100%)' }} />
                ) : (
                  <span style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '600' }}>No Image</span>
                )}
              </div>
              
              <div>
                <div className="product-name" style={{ fontSize: '14px', fontWeight: '800', color: '#111', marginBottom: '4px', lineHeight: '1.2' }}>{item.name}</div>
                <div className="product-price" style={{ fontSize: '15px', fontWeight: '900', color: '#b85e2b' }}>₱ {item.price.toFixed(2)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}