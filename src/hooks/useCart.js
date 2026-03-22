import { useState, useEffect } from 'react';

export function useCart(inventory, recipes, menuItems, showAlert) {
  const [cart, setCart] = useState([]);
  const [savedOrders, setSavedOrders] = useState(() => {
    const saved = localStorage.getItem('tallybrew_saved_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [discount, setDiscount] = useState({ label: 'No Discount', rate: 0 });
  const [modifierModal, setModifierModal] = useState({
    isOpen: false, product: null, size: 'Regular', milk: 'Whole', addons: [] 
  });

  const availableAddons = menuItems.filter(item => item.category === 'Add-on');
  const availableMilks = menuItems.filter(item => item.category === 'Milk');

  useEffect(() => {
    localStorage.setItem('tallybrew_saved_orders', JSON.stringify(savedOrders));
  }, [savedOrders]);

  const handleHoldOrder = (customerName) => {
    const newOrder = {
      id: Date.now().toString(), customerName, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cart: [...cart], discount: { ...discount }
    };
    setSavedOrders(prev => [...prev, newOrder]);
    setCart([]); setDiscount({ label: 'No Discount', rate: 0 });
  };

  const handleResumeOrder = (order) => {
    setCart(order.cart); setDiscount(order.discount || { label: 'No Discount', rate: 0 });
    setSavedOrders(prev => prev.filter(o => o.id !== order.id));
  };

  const handleDeleteSavedOrder = (id) => setSavedOrders(prev => prev.filter(o => o.id !== id));
  const handleClearCart = () => { setCart([]); setDiscount({ label: 'No Discount', rate: 0 }); };

  const checkStockAvailability = (targetItem, quantityToAdd) => {
    const projectedUsage = {};
    cart.forEach(cItem => {
        const baseId = cItem.id.toString().split('-')[0];
        const relationalRecipe = recipes.filter(r => r.menu_item_id.toString() === baseId);
        relationalRecipe.forEach(req => { projectedUsage[req.inventory_item_id] = (projectedUsage[req.inventory_item_id] || 0) + (Number(req.quantity_required) * cItem.qty); });
        if (cItem.recipe && cItem.recipe.startsWith('[')) {
            try { JSON.parse(cItem.recipe).forEach(req => { projectedUsage[req.id] = (projectedUsage[req.id] || 0) + (Number(req.qty) * cItem.qty); }); } catch (e) {}
        }
    });

    const targetBaseId = targetItem.id.toString().split('-')[0];
    recipes.filter(r => r.menu_item_id.toString() === targetBaseId).forEach(req => { projectedUsage[req.inventory_item_id] = (projectedUsage[req.inventory_item_id] || 0) + (Number(req.quantity_required) * quantityToAdd); });
    if (targetItem.recipe && targetItem.recipe.startsWith('[')) {
        try { JSON.parse(targetItem.recipe).forEach(req => { projectedUsage[req.id] = (projectedUsage[req.id] || 0) + (Number(req.qty) * quantityToAdd); }); } catch (e) {}
    }

    for (const [invId, totalNeeded] of Object.entries(projectedUsage)) {
        const invItem = inventory.find(i => i.id.toString() === invId.toString());
        if (invItem) {
            const stock = Math.max(Number(invItem.stock_qty || 0), 0);
            if (totalNeeded > stock) return { allowed: false, itemName: invItem.name, needed: totalNeeded, stock };
        }
    }
    return { allowed: true };
  };

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleItemClick = (product) => {
    if (['Snacks', 'Rice Meals', 'Add-on', 'Milk'].includes(product.category)) { 
      const check = checkStockAvailability(product, 1);
      if (!check.allowed) { showAlert(`CRITICAL LOW STOCK: Cannot add ${product.name}. You only have ${check.stock} ${check.itemName} left.`, 'error'); return; }
      addToCart(product); return; 
    }
    setModifierModal({ isOpen: true, product: product, size: 'Regular', milk: 'Whole', addons: [] });
  };

  const toggleAddon = (addonObj) => {
    setModifierModal(prev => {
      const exists = prev.addons.find(a => a.id === addonObj.id);
      return { ...prev, addons: exists ? prev.addons.filter(a => a.id !== addonObj.id) : [...prev.addons, addonObj] };
    });
  };

  const confirmModifiersAndAddToCart = () => {
    const { product, size, milk, addons } = modifierModal;
    let extraPrice = 0; let modLabels = []; const mergedRecipe = [];

    const addRecipeItems = (recipeStr, multiplier = 1) => {
      if (!recipeStr || !recipeStr.startsWith('[')) return;
      try {
        JSON.parse(recipeStr).forEach(item => {
          const existing = mergedRecipe.find(r => r.id === item.id);
          const scaledQty = Number(item.qty) * multiplier;
          if (existing) { existing.qty = Number(existing.qty) + scaledQty; } else { mergedRecipe.push({ ...item, qty: scaledQty }); }
        });
      } catch(e) {}
    };

    const sizeMultiplier = size === 'Large' ? 1.5 : 1;
    if (size === 'Large') { extraPrice += 20; modLabels.push('Lrg'); }
    addRecipeItems(product.recipe, sizeMultiplier);

    if (milk !== 'Whole') {
      const selectedMilkObj = availableMilks.find(m => m.name === milk);
      if (selectedMilkObj) {
        extraPrice += Number(selectedMilkObj.price); modLabels.push(selectedMilkObj.name);
        const milkIngredientIds = inventory.filter(ing => ing.name.toLowerCase().includes('milk') && !ing.name.toLowerCase().includes(selectedMilkObj.name.toLowerCase())).map(ing => ing.id);
        for (let i = mergedRecipe.length - 1; i >= 0; i--) { if (milkIngredientIds.includes(mergedRecipe[i].id)) { mergedRecipe.splice(i, 1); } }
        addRecipeItems(selectedMilkObj.recipe, sizeMultiplier); 
      }
    }
    
    addons.forEach(a => { extraPrice += Number(a.price); modLabels.push('+' + a.name); addRecipeItems(a.recipe, 1); });

    const finalPrice = Number(product.price) + extraPrice;
    const modifierString = modLabels.length > 0 ? ` (${modLabels.join(', ')})` : '';
    const uniqueId = `${product.id}-${size}-${milk}-${addons.map(a=>a.id).sort().join('-')}`;
    const itemToCart = { ...product, id: uniqueId, name: `${product.name}${modifierString}`, price: finalPrice, recipe: JSON.stringify(mergedRecipe) };

    const check = checkStockAvailability(itemToCart, 1);
    if (!check.allowed) { showAlert(`CRITICAL LOW STOCK: Cannot complete this order. You only have ${check.stock} ${check.itemName} left.`, 'error'); return; }

    addToCart(itemToCart);
    setModifierModal({ isOpen: false, product: null, size: 'Regular', milk: 'Whole', addons: [] });
  };

  const updateQty = (id, amount) => { 
    if (amount > 0) {
      const itemToUpdate = cart.find(i => i.id === id);
      if (itemToUpdate) {
          const check = checkStockAvailability(itemToUpdate, amount);
          if (!check.allowed) { showAlert(`CRITICAL LOW STOCK: Cannot add more. You only have ${check.stock} ${check.itemName} left.`, 'error'); return; }
      }
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: item.qty + amount } : item).filter(i => i.qty > 0)); 
  };

  const previewExtraCost = () => {
    if(!modifierModal.product) return 0;
    let extra = 0;
    if (modifierModal.size === 'Large') extra += 20;
    if (modifierModal.milk !== 'Whole') {
      const selectedMilk = availableMilks.find(m => m.name === modifierModal.milk);
      if (selectedMilk) extra += Number(selectedMilk.price);
    }
    modifierModal.addons.forEach(a => { extra += Number(a.price); });
    return extra;
  };

  return {
    cart, setCart, savedOrders, discount, setDiscount, modifierModal, setModifierModal,
    availableMilks, availableAddons,
    handleHoldOrder, handleResumeOrder, handleDeleteSavedOrder, handleClearCart,
    handleItemClick, toggleAddon, confirmModifiersAndAddToCart, updateQty, previewExtraCost
  };
}