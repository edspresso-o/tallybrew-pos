import React from 'react';

export default function ModifierModal({ 
  modifierModal, setModifierModal, availableMilks, availableAddons, 
  previewExtraCost, toggleAddon, confirmModifiersAndAddToCart 
}) {
  if (!modifierModal.isOpen) return null;

  return (
    <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10005, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#FDFBF7', borderRadius: '32px', padding: '35px', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', animation: 'popIn 0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 5px 0', color: '#3B2213', letterSpacing: '-0.5px' }}>Customize Order</h2>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#B56124' }}>{modifierModal.product.name} — ₱{(modifierModal.product.price + previewExtraCost()).toFixed(2)}</p>
          </div>
          <button onClick={() => setModifierModal({ ...modifierModal, isOpen: false })} style={{ background: '#E6D0A9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: '#3B2213', fontSize: '20px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
        </div>

        {/* --- TEMPERATURE TOGGLE (Hidden for Frappes) --- */}
        {modifierModal.product.category !== 'Frappe' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Temperature</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              
              {/* Hot Button */}
              <button 
                onClick={() => setModifierModal({...modifierModal, temp: 'Hot'})} 
                style={{ flex: 1, padding: '14px', borderRadius: '14px', border: modifierModal.temp === 'Hot' ? '2px solid #ef4444' : '2px solid #e5e7eb', background: modifierModal.temp === 'Hot' ? '#fef2f2' : '#fff', color: modifierModal.temp === 'Hot' ? '#ef4444' : '#3B2213', fontWeight: '900', fontSize: '14px', cursor: 'pointer', transition: '0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}
              >
                Hot
              </button>
              
              {/* Iced Button */}
              <button 
                onClick={() => setModifierModal({...modifierModal, temp: 'Iced'})} 
                style={{ flex: 1, padding: '14px', borderRadius: '14px', border: modifierModal.temp === 'Iced' ? '2px solid #3b82f6' : '2px solid #e5e7eb', background: modifierModal.temp === 'Iced' ? '#eff6ff' : '#fff', color: modifierModal.temp === 'Iced' ? '#3b82f6' : '#3B2213', fontWeight: '900', fontSize: '14px', cursor: 'pointer', transition: '0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}
              >
                Iced
              </button>

            </div>
          </div>
        )}

        {/* Size Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Size</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['Regular', 'Large'].map(size => (
              <button key={size} onClick={() => setModifierModal({...modifierModal, size})} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: modifierModal.size === size ? '2px solid #3B2213' : '2px solid #e5e7eb', background: modifierModal.size === size ? '#3B2213' : '#fff', color: modifierModal.size === size ? '#FDFBF7' : '#3B2213', fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: '0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                {size} {size === 'Large' && <span style={{ opacity: modifierModal.size === size ? 0.7 : 0.5, fontSize: '11px' }}>(+₱20)</span>}
              </button>
            ))}
          </div>
        </div>
        
        {/* Milk Options */}
        {!['americano', 'espresso'].some(keyword => modifierModal.product.name.toLowerCase().includes(keyword)) && (
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Milk Option</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setModifierModal({...modifierModal, milk: 'Whole'})} style={{ flex: 1, minWidth: '90px', padding: '10px 5px', borderRadius: '14px', border: modifierModal.milk === 'Whole' ? '2px solid #3B2213' : '2px solid #e5e7eb', background: modifierModal.milk === 'Whole' ? '#3B2213' : '#fff', color: modifierModal.milk === 'Whole' ? '#FDFBF7' : '#3B2213', fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><span>Whole</span></button>
              {availableMilks.map(milkObj => (
                <button key={milkObj.id} onClick={() => setModifierModal({...modifierModal, milk: milkObj.name})} style={{ flex: 1, minWidth: '90px', padding: '10px 5px', borderRadius: '14px', border: modifierModal.milk === milkObj.name ? '2px solid #3B2213' : '2px solid #e5e7eb', background: modifierModal.milk === milkObj.name ? '#3B2213' : '#fff', color: modifierModal.milk === milkObj.name ? '#FDFBF7' : '#3B2213', fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><span>{milkObj.name}</span><span style={{ opacity: modifierModal.milk === milkObj.name ? 0.7 : 0.5, fontSize: '11px', marginTop: '2px' }}>(+₱{milkObj.price})</span></button>
              ))}
            </div>
          </div>
        )}
        
        {/* Add-Ons */}
        <div style={{ marginBottom: '35px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Add-Ons</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {availableAddons.length > 0 ? availableAddons.map(addon => {
              const isActive = modifierModal.addons.find(a => a.id === addon.id);
              return (
                <div key={addon.id} onClick={() => toggleAddon(addon)} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderRadius: '14px', border: isActive ? '2px solid #B56124' : '1px solid #e5e7eb', background: isActive ? '#FDFBF7' : '#fff', cursor: 'pointer', transition: '0.2s', boxShadow: isActive ? '0 0 0 1px #B56124' : 'none' }}><span style={{ fontWeight: '800', color: '#3B2213', fontSize: '14px' }}>{addon.name}</span><span style={{ fontWeight: '800', color: isActive ? '#B56124' : '#9ca3af', fontSize: '14px' }}>+₱{addon.price}</span></div>
              );
            }) : ( <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, fontStyle: 'italic' }}>No add-ons created yet. Add them in the Manage section.</p> )}
          </div>
        </div>

        <button onClick={confirmModifiersAndAddToCart} style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: '#B56124', color: '#fff', fontWeight: '900', fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(181, 97, 36, 0.25)', transition: '0.2s' }}>Add to Order — ₱{(modifierModal.product.price + previewExtraCost()).toFixed(2)}</button>
      </div>
    </div>
  );
}