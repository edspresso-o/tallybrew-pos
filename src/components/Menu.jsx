import React, { useState, useEffect } from 'react';


// THE FIX: Advanced Offline Image Caching & Instant Loading
const SmoothMenuImage = ({ src, alt, available }) => {
  const [hasError, setHasError] = useState(false);
  const [cachedSrc, setCachedSrc] = useState(null);

  useEffect(() => {
    if (!src) return;

    let isMounted = true;

    const loadAndCacheImage = async () => {
     
      if (!('caches' in window)) {
        if (isMounted) setCachedSrc(src);
        return;
      }

      try {
        // Open our secure offline image vault
        const cache = await caches.open('tallybrew-menu-images');
        const cachedResponse = await cache.match(src);

        if (cachedResponse) {
          // 🟢 SUCCESS: Found the actual image file locally! Load it instantly.
          const blob = await cachedResponse.blob();
          if (isMounted) setCachedSrc(URL.createObjectURL(blob));
        } else if (navigator.onLine) {
          // 🌐 ONLINE: Download the image and save a copy to the local vault.
          const response = await fetch(src);
          if (response.ok) {
            await cache.put(src, response.clone());
            const blob = await response.blob();
            if (isMounted) setCachedSrc(URL.createObjectURL(blob));
          } else {
            if (isMounted) setCachedSrc(src);
          }
        } else {
          // 🔴 OFFLINE & NOT CACHED YET: Safe fallback.
          if (isMounted) setCachedSrc(src); 
        }
      } catch (err) {
        if (isMounted) setCachedSrc(src);
      }
    };

    loadAndCacheImage();

    return () => {
      isMounted = false; // Cleanup to prevent memory leaks
    };
  }, [src]);

  if (!src || hasError) {
    return (
      <div style={{ width: '100%', height: '100%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
         <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold' }}>No Image</span>
      </div>
    );
  }

  // Show a tiny blank placeholder for a millisecond while pulling from the vault
  if (!cachedSrc) {
     return <div style={{ width: '100%', height: '100%', backgroundColor: '#ffffff', borderRadius: '8px' }}></div>;
  }

  return (
    <img
      src={cachedSrc}
      alt={alt}
      onError={() => setHasError(true)}
      style={{ 
        width: '100%', 
        height: '100%', 
        objectFit: 'contain', 
        padding: '5px', 
        boxSizing: 'border-box',
        filter: available ? 'none' : 'grayscale(100%)',
        backgroundColor: '#ffffff'
      }}
    />
  );
};

export default function Menu({ 
  menuItems, 
  categories, 
  activeCategory, 
  setActiveCategory, 
  addToCart, 
  onManageClick, 
  deleteProduct,
  inventory = [], 
  recipes = [] 
}) {
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  const filteredItems = activeCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  const isDrinkAvailable = (item) => {
    const drinkRecipe = recipes.filter(r => r.menu_item_id.toString() === item.id.toString());
    
    if (drinkRecipe.length > 0) {
      for (const ingredientReq of drinkRecipe) {
       // Future recipe logic goes here
      }
    }

    if (item.recipe && item.recipe.startsWith('[')) {
      try {
        const recipeList = JSON.parse(item.recipe);
        
        for (let req of recipeList) {
          if (!req.name) {
             const stockItem = inventory.find(i => i.id === req.id);
             if (!stockItem || Number(stockItem.stock_qty) < Number(req.qty)) return false;
          } else {
             const stockItem = inventory.find(i => i.name.toLowerCase() === req.name.toLowerCase());
             if (!stockItem || Number(stockItem.stock_qty) < Number(req.qty)) return false;
          }
        }
      } catch (error) {
        console.error("Could not read recipe for", item.name);
      }
    }
    
    return true; 
  };

  return (
    <div className="main-menu" style={{ padding: '0 20px 20px 20px', flex: 1, width: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
      
      <div style={{ position: 'sticky', top: 0, backgroundColor: '#f3f4f6', zIndex: 10, paddingTop: '20px', paddingBottom: '10px' }}>
        
        <div className="menu-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '15px', marginBottom: '15px' }}>
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
            style={{ padding: '8px 14px', backgroundColor: isDeleteMode ? '#ef4444' : '#fff', color: isDeleteMode ? '#fff' : '#ef4444', border: '2px solid #ef4444', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isDeleteMode ? '0 4px 10px rgba(239,68,68,0.3)' : 'none', whiteSpace: 'nowrap' }}
          >
            {isDeleteMode ? 'Done Removing' : 'Remove Items'}
          </button>
        </div>

        <div className="category-pills" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px', WebkitOverflowScrolling: 'touch' }}>
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              style={{ padding: '8px 16px', borderRadius: '20px', border: activeCategory === cat ? '2px solid #b85e2b' : '2px solid #e5e7eb', background: activeCategory === cat ? '#b85e2b' : '#fff', color: activeCategory === cat ? '#fff' : '#4b5563', fontWeight: '700', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s ease', boxShadow: activeCategory === cat ? '0 4px 10px rgba(184, 94, 43, 0.2)' : 'none' }}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', paddingTop: '10px' }}>
        {filteredItems.map(item => {
          
          const available = isDrinkAvailable(item);

          return (
            <div 
              key={item.id} 
              className="product-card" 
              onClick={() => {
                if (isDeleteMode) {
                  deleteProduct(item.id);
                } else if (available) {
                  addToCart(item); 
                }
              }}
              style={{
                background: available ? '#fff' : '#f3f4f6',
                borderRadius: '16px',
                padding: '10px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                cursor: (available || isDeleteMode) ? 'pointer' : 'not-allowed',
                border: isDeleteMode ? '2px dashed #ef4444' : '2px solid transparent',
                position: 'relative',
                transition: 'transform 0.1s, box-shadow 0.2s',
                opacity: (available || isDeleteMode) ? 1 : 0.6,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                pointerEvents: 'auto' 
              }}
              onMouseDown={(e) => (!isDeleteMode && available) && (e.currentTarget.style.transform = 'scale(0.96)')}
              onMouseUp={(e) => (!isDeleteMode && available) && (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (!isDeleteMode && available) && (e.currentTarget.style.transform = 'scale(1)')}
            >
              
              {!available && !isDeleteMode && (
                <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '11px', zIndex: 5, boxShadow: '0 4px 10px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
                  Out of Stock
                </div>
              )}

              {isDeleteMode && (
                <div style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ef4444', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '20px', boxShadow: '0 4px 10px rgba(239,68,68,0.4)', zIndex: 10 }}>−</div>
              )}

              <div className="product-image" style={{ width: '100%', height: '80px', backgroundColor: '#ffffff', borderRadius: '12px', marginBottom: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <SmoothMenuImage src={item.image_url} alt={item.name} available={available} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                <div className="product-name" style={{ fontSize: '13px', fontWeight: '800', color: '#111', marginBottom: '4px', lineHeight: '1.2' }}>{item.name}</div>
                <div className="product-price" style={{ fontSize: '14px', fontWeight: '900', color: '#b85e2b' }}>₱ {item.price.toFixed(2)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}