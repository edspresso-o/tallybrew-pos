import React, { useState } from 'react';

export default function Menu({ menuItems, categories, activeCategory, setActiveCategory, addToCart, onManageClick, deleteProduct }) {
  // Tracks whether we are in "Delete Mode" or normal "Selling Mode"
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  // Filter items based on the selected category pill
  const filteredItems = activeCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  return (
    // RESPONSIVE UPDATE: Added width 100% and boxSizing so it never breaks the screen width
    <div className="main-menu" style={{ padding: '20px', flex: 1, width: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
      
      {/* HEADER AREA: Added flexWrap so the title and button stack cleanly on tiny phone screens */}
      <div className="menu-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '15px', marginBottom: '25px' }}>
        
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#000', letterSpacing: '-1px' }}>
            Menu
          </h1>
          <span 
            onClick={onManageClick}
            style={{ 
              fontSize: '18px', 
              color: '#9ca3af', 
              fontWeight: '800', 
              cursor: 'pointer',
              transition: 'color 0.2s',
              letterSpacing: '-0.5px'
            }}
            onMouseOver={(e) => e.target.style.color = '#6b7280'}
            onMouseOut={(e) => e.target.style.color = '#9ca3af'}
          >
            Manage
          </span>
        </div>

        {/* THE SAFE DELETE TOGGLE BUTTON */}
        <button
          onClick={() => setIsDeleteMode(!isDeleteMode)}
          style={{
            padding: '10px 16px',
            backgroundColor: isDeleteMode ? '#ef4444' : '#fff',
            color: isDeleteMode ? '#fff' : '#ef4444',
            border: '2px solid #ef4444',
            borderRadius: '10px',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: isDeleteMode ? '0 4px 10px rgba(239,68,68,0.3)' : 'none',
            whiteSpace: 'nowrap'
          }}
        >
          {isDeleteMode ? 'Done Removing' : 'Remove Items'}
        </button>

      </div>

      {/* CATEGORIES: Users can swipe left/right on mobile to see all categories */}
      <div className="category-pills" style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '25px', 
        overflowX: 'auto', 
        paddingBottom: '10px',
        WebkitOverflowScrolling: 'touch' /* Makes swiping buttery smooth on iPhones */
      }}>
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: activeCategory === cat ? '2px solid #b85e2b' : '2px solid #e5e7eb',
              background: activeCategory === cat ? '#b85e2b' : '#fff',
              color: activeCategory === cat ? '#fff' : '#4b5563',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              boxShadow: activeCategory === cat ? '0 4px 10px rgba(184, 94, 43, 0.2)' : 'none'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PRODUCT GRID - THE MAGIC RESPONSIVE TRICK */}
      {/* minmax(140px, 1fr) ensures exactly 2 items fit on a small phone, 3 on a tablet, and 4+ on desktop! */}
      <div className="product-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
        gap: '15px' 
      }}>
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            className="product-card" 
            
            // SMART CLICK LOGIC: Decides what to do based on the current mode
            onClick={() => {
              if (isDeleteMode) {
                deleteProduct(item.id);
              } else {
                addToCart(item);
              }
            }}

            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              border: isDeleteMode ? '2px dashed #ef4444' : '2px solid transparent',
              position: 'relative',
              transition: 'transform 0.1s, box-shadow 0.2s',
              transform: isDeleteMode ? 'scale(0.96)' : 'scale(1)',
              opacity: isDeleteMode ? 0.9 : 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            // Add a little tap effect for mobile users
            onMouseDown={(e) => !isDeleteMode && (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={(e) => !isDeleteMode && (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => !isDeleteMode && (e.currentTarget.style.transform = 'scale(1)')}
          >
            
            {/* FLOATING RED MINUS SIGN (Only visible in Delete Mode) */}
            {isDeleteMode && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#ef4444',
                color: 'white',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '20px',
                boxShadow: '0 4px 10px rgba(239,68,68,0.4)',
                zIndex: 10
              }}>
                −
              </div>
            )}

            <div className="product-image" style={{ width: '100%', height: '120px', backgroundColor: '#f9fafb', borderRadius: '12px', marginBottom: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px', boxSizing: 'border-box' }} />
              ) : (
                <span style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '600' }}>No Image</span>
              )}
            </div>
            
            <div>
              <div className="product-name" style={{ fontSize: '14px', fontWeight: '800', color: '#111', marginBottom: '4px', lineHeight: '1.2' }}>
                {item.name}
              </div>
              <div className="product-price" style={{ fontSize: '15px', fontWeight: '900', color: '#b85e2b' }}>
                ₱ {item.price.toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}