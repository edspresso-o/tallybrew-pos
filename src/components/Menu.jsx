import React, { useState, useEffect } from 'react';

// Advanced Offline Image Caching & Instant Loading
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
        const cache = await caches.open('tallybrew-menu-images');
        const cachedResponse = await cache.match(src);

        if (cachedResponse) {
          // 🟢 SUCCESS: Found locally
          const blob = await cachedResponse.blob();
          if (isMounted) setCachedSrc(URL.createObjectURL(blob));
        } else if (navigator.onLine) {
          // 🌐 ONLINE: Download and cache
          const response = await fetch(src);
          if (response.ok) {
            await cache.put(src, response.clone());
            const blob = await response.blob();
            if (isMounted) setCachedSrc(URL.createObjectURL(blob));
          } else {
            if (isMounted) setCachedSrc(src);
          }
        } else {
          // 🔴 OFFLINE & NOT CACHED
          if (isMounted) setCachedSrc(src); 
        }
      } catch (err) {
        if (isMounted) setCachedSrc(src);
      }
    };

    loadAndCacheImage();

    return () => { isMounted = false; };
  }, [src]);

  if (!src || hasError) {
    return (
      <div style={{ width: '100%', height: '100%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'inherit' }}>
         <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold' }}>No Image</span>
      </div>
    );
  }

  if (!cachedSrc) {
     return <div style={{ width: '100%', height: '100%', backgroundColor: '#ffffff', borderRadius: 'inherit' }}></div>;
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
        padding: '8px', 
        boxSizing: 'border-box',
        filter: available ? 'none' : 'grayscale(100%)',
        backgroundColor: '#ffffff',
        borderRadius: 'inherit'
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
       // Future recipe logic
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
    <div className="main-menu-container">
      
      {/* THE FIX: Highly Responsive CSS Grid & Layout Logic */}
      <style>{`
        .main-menu-container {
          padding: clamp(15px, 4vw, 25px);
          flex: 1;
          width: 100%;
          box-sizing: border-box;
          overflow-y: auto;
          background-color: #f9fafb;
        }

        /* Desktop/Tablet Grid: Automatically fits as many 160px+ cards as possible */
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: 16px;
          padding-top: 15px;
          padding-bottom: 40px;
        }

        .product-card {
          background-color: #fff;
          border-radius: 20px;
          padding: 16px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          position: relative;
          transition: transform 0.1s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
          pointer-events: auto;
        }
        
        .product-card:hover:not(.disabled-card) {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(59, 34, 19, 0.08);
        }

        .product-image-wrapper {
          width: 100%;
          aspect-ratio: 1 / 1; /* PERFECT SQUARE ON EVERY DEVICE */
          background-color: #ffffff;
          border-radius: 14px;
          margin-bottom: 12px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid #f3f4f6;
        }

        .product-name { font-size: 15px; font-weight: 800; color: #111; margin-bottom: 6px; line-height: 1.2; }
        .product-price { font-size: 16px; font-weight: 900; color: #b85e2b; }

        .category-pills::-webkit-scrollbar { display: none; }

        /* Mobile Grid: Forces a perfect 2-column layout so cards aren't squished or massive */
        @media (max-width: 600px) {
          .main-menu-container { padding: 15px; }
          .menu-header-top { flex-direction: column; align-items: flex-start !important; }
          
          .product-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px;
          }
          .product-card {
            padding: 12px;
            border-radius: 16px;
          }
          .product-image-wrapper {
            margin-bottom: 8px;
            border-radius: 12px;
          }
          .product-name { font-size: 13px; margin-bottom: 4px; }
          .product-price { font-size: 14px; }
        }
      `}</style>

      <div style={{ position: 'sticky', top: 0, backgroundColor: '#f9fafb', zIndex: 10, paddingTop: '10px', paddingBottom: '15px' }}>
        
        <div className="menu-header-top" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '15px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: '900', margin: 0, color: '#111', letterSpacing: '-1px' }}>Menu</h1>
            <span 
              onClick={onManageClick}
              style={{ fontSize: 'clamp(15px, 3vw, 18px)', color: '#9ca3af', fontWeight: '800', cursor: 'pointer', transition: 'color 0.2s', letterSpacing: '-0.5px' }}
              onMouseOver={(e) => e.target.style.color = '#6b7280'}
              onMouseOut={(e) => e.target.style.color = '#9ca3af'}
            >
              Manage
            </span>
          </div>

          <button
            onClick={() => setIsDeleteMode(!isDeleteMode)}
            style={{ padding: '10px 16px', backgroundColor: isDeleteMode ? '#ef4444' : '#fff', color: isDeleteMode ? '#fff' : '#ef4444', border: '2px solid #ef4444', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isDeleteMode ? '0 4px 10px rgba(239,68,68,0.3)' : 'none', whiteSpace: 'nowrap' }}
          >
            {isDeleteMode ? 'Done Removing' : 'Remove Items'}
          </button>
        </div>

        <div className="category-pills" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              style={{ 
                padding: '10px 20px', 
                borderRadius: '24px', 
                border: activeCategory === cat ? '2px solid #b85e2b' : '2px solid #e5e7eb', 
                background: activeCategory === cat ? '#b85e2b' : '#fff', 
                color: activeCategory === cat ? '#fff' : '#4b5563', 
                fontWeight: '800', 
                fontSize: '13px', 
                cursor: 'pointer', 
                whiteSpace: 'nowrap', 
                transition: 'all 0.2s ease', 
                boxShadow: activeCategory === cat ? '0 4px 12px rgba(184, 94, 43, 0.25)' : 'none' 
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="product-grid">
        {filteredItems.map(item => {
          
          const available = isDrinkAvailable(item);
          const isDisabled = !available && !isDeleteMode;

          return (
            <div 
              key={item.id} 
              className={`product-card ${isDisabled ? 'disabled-card' : ''}`}
              onClick={() => {
                if (isDeleteMode) {
                  deleteProduct(item.id);
                } else if (available) {
                  addToCart(item); 
                }
              }}
              style={{
                background: available ? '#fff' : '#f9fafb',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                border: isDeleteMode ? '2px dashed #ef4444' : '2px solid transparent',
                opacity: isDisabled ? 0.6 : 1,
              }}
              onMouseDown={(e) => (!isDisabled && !isDeleteMode) && (e.currentTarget.style.transform = 'scale(0.96)')}
              onMouseUp={(e) => (!isDisabled && !isDeleteMode) && (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={(e) => (!isDisabled && !isDeleteMode) && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              
              {!available && !isDeleteMode && (
                <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '8px', fontWeight: '900', fontSize: '11px', zIndex: 5, boxShadow: '0 4px 15px rgba(0,0,0,0.2)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Out of Stock
                </div>
              )}

              {isDeleteMode && (
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: '#ef4444', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '24px', boxShadow: '0 4px 10px rgba(239,68,68,0.4)', zIndex: 10 }}>−</div>
              )}

              <div className="product-image-wrapper">
                <SmoothMenuImage src={item.image_url} alt={item.name} available={available} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                <div className="product-name">{item.name}</div>
                <div className="product-price">₱{item.price.toFixed(2)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 