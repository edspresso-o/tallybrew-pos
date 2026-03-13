import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import Menu from './components/Menu.jsx';
import Cart from './components/Cart.jsx';
import Inventory from './components/Inventory.jsx';
import Settings from './components/Settings.jsx'; 
import AddProduct from './components/AddProduct.jsx';
import AddIngredient from './components/AddIngredient.jsx'; 
import RecordWastage from './components/RecordWastage.jsx'; 
import DiscountModal from './components/DiscountModal.jsx';
import CheckoutModal from './components/CheckoutModal.jsx'; 
import EditProduct from './components/EditProduct.jsx';
import ManualRestock from './components/ManualRestock.jsx';
import Auth from './components/Auth.jsx'; 
import CashierLock from './components/CashierLock.jsx'; 
import LandingPage from './components/LandingPage.jsx';
import './App.css';

function App() {
  const [session, setSession] = useState(null); 
  const [activeCashier, setActiveCashier] = useState(null); 
  const [showLanding, setShowLanding] = useState(true); 
  const [currentView, setCurrentView] = useState("Menu");
  
  const [menuItems, setMenuItems] = useState([]);
  const [inventory, setInventory] = useState([]); 
  const [sales, setSales] = useState([]);
  const [cart, setCart] = useState([]);
  
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false); 
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isWastageOpen, setIsWastageOpen] = useState(false); 
  const [isDiscountOpen, setIsDiscountOpen] = useState(false); 
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false); 
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [discount, setDiscount] = useState({ label: 'No Discount', rate: 0 });
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  
  const [showManagerAuth, setShowManagerAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [managerPinInput, setManagerPinInput] = useState("");

  const [activeShift, setActiveShift] = useState(null);
  const [pendingCashier, setPendingCashier] = useState(null);
  const [showStartShift, setShowStartShift] = useState(false);
  const [startingCashInput, setStartingCashInput] = useState("");
  
  const [showEndShift, setShowEndShift] = useState(false);
  const [endingCashInput, setEndingCashInput] = useState("");
  
  const [shiftSalesAmount, setShiftSalesAmount] = useState(0);
  const [shiftExpectedCash, setShiftExpectedCash] = useState(0);

  const [modifierModal, setModifierModal] = useState({
    isOpen: false,
    product: null,
    size: 'Regular',
    milk: 'Whole',
    addons: [] 
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSalesCount, setPendingSalesCount] = useState(0);
  
  // NEW STATE: Controls the mobile hamburger menu
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const categories = ["All", "Hot Coffee", "Iced Coffee", "Non-Coffee", "Frappe", "Snacks", "Rice Meals", "Add-on", "Milk"];

  const getOfflineQueue = () => {
    try {
      return JSON.parse(localStorage.getItem('tallybrew_offline_queue') || '[]');
    } catch (e) {
      return [];
    }
  };

  const fetchAllData = async () => {
    const { data: pData } = await supabase.from('products').select('*').order('name', { ascending: true });
    if (pData) setMenuItems(pData);
    
    const { data: iData } = await supabase.from('inventory').select('*').order('name', { ascending: true });
    if (iData) setInventory(iData);
    
    const { data: sData } = await supabase.from('sales').select('*').order('created_at', { ascending: true });
    if (sData) setSales(sData);
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const pending = getOfflineQueue();
    setPendingSalesCount(pending.length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) { setActiveCashier(null); setActiveShift(null); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) { setActiveCashier(null); setActiveShift(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session && isOnline) fetchAllData(); }, [session, isOnline]);

  const handleCashierLogin = async (cashier) => {
    try {
      const { data, error } = await supabase.from('shifts').select('*').eq('cashier_name', cashier.username).eq('status', 'open').order('start_time', { ascending: false }).limit(1);
      if (data && data.length > 0) {
        setActiveShift(data[0]); setActiveCashier(cashier); setCurrentView('Menu');
      } else {
        setPendingCashier(cashier); setShowStartShift(true); 
      }
    } catch(e) { alert("Error checking shift status."); }
  };

  const openRegister = async () => {
    if (!pendingCashier) return;
    const cash = parseFloat(startingCashInput) || 0;
    const { data, error } = await supabase.from('shifts').insert([{ cashier_name: pendingCashier.username, starting_cash: cash }]).select().single();
    if (data) {
      setActiveShift(data); setActiveCashier(pendingCashier); setShowStartShift(false); setPendingCashier(null); setStartingCashInput(""); setCurrentView('Menu');
    }
  };

  const requestEndShift = () => {
    const role = activeCashier?.role || 'cashier';
    if (role !== 'manager' && role !== 'admin') {
      setPendingAction({ type: 'close_register' }); setShowManagerAuth(true); 
    } else { prepareEndShift(); }
  };

  const prepareEndShift = async () => {
    const { data: shiftSales } = await supabase.from('sales').select('total_amount').gte('created_at', activeShift.start_time);
    const totalSales = shiftSales ? shiftSales.reduce((s, sale) => s + Number(sale.total_amount), 0) : 0;
    const expectedTotal = Number(activeShift.starting_cash) + totalSales;
    setShiftSalesAmount(totalSales); setShiftExpectedCash(expectedTotal); setShowEndShift(true);
  };

  const closeRegister = async () => {
    const actual = parseFloat(endingCashInput) || 0;
    const shortage = actual - shiftExpectedCash; 
    await supabase.from('shifts').update({ end_time: new Date().toISOString(), expected_cash: shiftExpectedCash, actual_cash: actual, shortage: shortage, status: 'closed' }).eq('id', activeShift.id);
    setShowEndShift(false); setEndingCashInput(""); setActiveShift(null); setActiveCashier(null); window.location.reload(); 
  };

  const handleItemClick = (product) => {
    if (['Snacks', 'Rice Meals', 'Add-on', 'Milk'].includes(product.category)) {
      addToCart(product);
      return;
    }
    setModifierModal({ isOpen: true, product: product, size: 'Regular', milk: 'Whole', addons: [] });
  };

  const toggleAddon = (addonObj) => {
    setModifierModal(prev => {
      const exists = prev.addons.find(a => a.id === addonObj.id);
      return {
        ...prev,
        addons: exists ? prev.addons.filter(a => a.id !== addonObj.id) : [...prev.addons, addonObj]
      };
    });
  };

  const confirmModifiersAndAddToCart = () => {
    const { product, size, milk, addons } = modifierModal;
    let extraPrice = 0;
    let modLabels = [];
    const mergedRecipe = [];

    const addRecipeItems = (recipeStr, multiplier = 1) => {
      if (!recipeStr || !recipeStr.startsWith('[')) return;
      try {
        const items = JSON.parse(recipeStr);
        items.forEach(item => {
          const existing = mergedRecipe.find(r => r.id === item.id);
          const scaledQty = Number(item.qty) * multiplier;
          if (existing) { existing.qty = Number(existing.qty) + scaledQty; } 
          else { mergedRecipe.push({ ...item, qty: scaledQty }); }
        });
      } catch(e) {}
    };

    const sizeMultiplier = size === 'Large' ? 1.5 : 1;
    if (size === 'Large') { extraPrice += 20; modLabels.push('Lrg'); }
    
    addRecipeItems(product.recipe, sizeMultiplier);

    if (milk !== 'Whole') {
      const selectedMilkObj = availableMilks.find(m => m.name === milk);
      if (selectedMilkObj) {
        extraPrice += Number(selectedMilkObj.price);
        modLabels.push(selectedMilkObj.name);
        
        const milkIngredientIds = inventory
          .filter(ing => ing.name.toLowerCase().includes('milk') && !ing.name.toLowerCase().includes(selectedMilkObj.name.toLowerCase()))
          .map(ing => ing.id);
          
        for (let i = mergedRecipe.length - 1; i >= 0; i--) {
          if (milkIngredientIds.includes(mergedRecipe[i].id)) {
            mergedRecipe.splice(i, 1);
          }
        }
        addRecipeItems(selectedMilkObj.recipe, sizeMultiplier); 
      }
    }
    
    addons.forEach(a => {
      extraPrice += Number(a.price);
      modLabels.push('+' + a.name);
      addRecipeItems(a.recipe, 1); 
    });

    const finalPrice = Number(product.price) + extraPrice;
    const modifierString = modLabels.length > 0 ? ` (${modLabels.join(', ')})` : '';
    const uniqueId = `${product.id}-${size}-${milk}-${addons.map(a=>a.id).sort().join('-')}`;

    addToCart({ 
      ...product, 
      id: uniqueId, 
      name: `${product.name}${modifierString}`, 
      price: finalPrice,
      recipe: JSON.stringify(mergedRecipe) 
    });
    
    setModifierModal({ isOpen: false, product: null, size: 'Regular', milk: 'Whole', addons: [] });
  };

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, amount) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: item.qty + amount } : item).filter(i => i.qty > 0));
  };

  const processOrderToSupabase = async (orderPackage) => {
    const { data: newSale, error: saleError } = await supabase.from('sales').insert([orderPackage.sale]).select().single();
    if (saleError) throw saleError;

    for (const cartItem of orderPackage.cart) {
      const nameParts = cartItem.name.split(' (');
      const baseName = nameParts[0];
      const modifiers = nameParts.length > 1 ? '(' + nameParts[1] : '';

      await supabase.from('sale_items').insert([{
        sale_id: newSale.id, 
        product_name: baseName,
        quantity: cartItem.qty,
        unit_price: cartItem.price,
        total_price: cartItem.price * cartItem.qty,
        modifiers: modifiers
      }]);

      if (cartItem.recipe && cartItem.recipe.startsWith('[')) {
        try {
          const recipeList = JSON.parse(cartItem.recipe);
          for (const req of recipeList) {
            const { data: ing } = await supabase.from('inventory').select('stock_qty').eq('id', req.id).single();
            if (ing) {
              const newQty = Number(ing.stock_qty) - (Number(req.qty) * Number(cartItem.qty));
              await supabase.from('inventory').update({ stock_qty: newQty }).eq('id', req.id);
            }
          }
        } catch(e) { console.error("Error parsing recipe", e) }
      }
    }
  };

  const syncPendingQueue = async () => {
    const pending = getOfflineQueue();
    if (pending.length === 0) return;

    let remainingQueue = [];
    for (const order of pending) {
      try {
        await processOrderToSupabase(order);
      } catch (err) {
        remainingQueue.push(order); 
      }
    }

    localStorage.setItem('tallybrew_offline_queue', JSON.stringify(remainingQueue));
    setPendingSalesCount(remainingQueue.length);
    
    if (remainingQueue.length === 0) {
      fetchAllData(); 
    }
  };

  const confirmPaymentAndSave = async (method, receivedAmount, customerName, orderType) => {
    const subtotal = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const finalTotal = subtotal * (1 - discount.rate);
    
    let itemsList = cart.map(item => `${item.qty}x ${item.name}`).join(', ');
    let summary = `[${orderType.toUpperCase()}] ${customerName || 'Guest'} - ${itemsList}`;
    if (discount.rate > 0) summary += ` (w/ ${discount.label} Discount)`;

    const orderPackage = {
      sale: { 
        total_amount: finalTotal, 
        items_count: cart.length, 
        items_summary: summary, 
        payment_method: method,
        created_at: new Date().toISOString() 
      },
      cart: [...cart]
    };

    if (isOnline) {
      try {
        await processOrderToSupabase(orderPackage);
        fetchAllData(); 
      } catch (err) { 
        saveOffline(orderPackage);
      }
    } else {
      saveOffline(orderPackage);
    }

    setIsCheckoutOpen(false); 
    setCart([]); 
    setDiscount({ label: 'No Discount', rate: 0 }); 
  };

  const saveOffline = (orderPackage) => {
    const pending = getOfflineQueue();
    pending.push(orderPackage);
    localStorage.setItem('tallybrew_offline_queue', JSON.stringify(pending));
    setPendingSalesCount(pending.length);
  };

  const handleNavigationRequest = (view) => {
    const role = activeCashier?.role || 'cashier'; 
    if ((view === 'Dashboard' || view === 'Inventory') && role !== 'manager' && role !== 'admin') {
      setPendingAction({ type: 'navigate', payload: view }); setShowManagerAuth(true);
    } else { setCurrentView(view); }
  };

  const requestDeleteProduct = (id) => {
    const role = activeCashier?.role || 'cashier';
    if (role !== 'manager' && role !== 'admin') { setPendingAction({ type: 'delete', payload: id }); setShowManagerAuth(true);
    } else { if (window.confirm("Delete this product?")) performDeleteProduct(id); }
  };

  const requestAddDiscount = () => {
    const role = activeCashier?.role || 'cashier';
    if (role !== 'manager' && role !== 'admin') { setPendingAction({ type: 'discount' }); setShowManagerAuth(true);
    } else { setIsDiscountOpen(true); }
  };

  const executeManagerOverride = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('pin', managerPinInput).in('role', ['manager', 'admin']).limit(1);
      if (data && data.length > 0) {
        if (pendingAction.type === 'navigate') setCurrentView(pendingAction.payload);
        else if (pendingAction.type === 'delete') performDeleteProduct(pendingAction.payload);
        else if (pendingAction.type === 'discount') setIsDiscountOpen(true);
        else if (pendingAction.type === 'close_register') prepareEndShift(); 
        setShowManagerAuth(false); setPendingAction(null); setManagerPinInput("");
      } else { alert("Incorrect PIN or you do not have Manager privileges!"); setManagerPinInput(""); }
    } catch (err) { alert("System Error."); setManagerPinInput(""); }
  };

  const performDeleteProduct = async (id) => {
    try { await supabase.from('products').delete().eq('id', id); fetchAllData(); } catch (error) { alert("Error: " + error.message); }
  };

  const addProduct = async (formData, selectedFile) => {
    try {
      let image_url = '';
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        let { error: uploadError } = await supabase.storage.from('products').upload(fileName, selectedFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('products').getPublicUrl(fileName);
        image_url = data.publicUrl;
      }
      await supabase.from('products').insert([{ name: formData.name, price: parseFloat(formData.price), category: formData.category, recipe: formData.recipe, image_url: image_url }]);
      fetchAllData(); setIsAddProductOpen(false);
    } catch (error) { alert("Error: " + error.message); }
  };

  const addIngredient = async (formData) => {
    try { await supabase.from('inventory').insert([{ name: formData.name, stock_qty: parseFloat(formData.stock_qty), unit: formData.unit }]); fetchAllData(); setIsAddIngredientOpen(false); } catch (error) { alert("Error: " + error.message); }
  };

  const handleManualRestock = async (id, newStock, invoiceData) => {
    await supabase.from('inventory').update({ stock_qty: newStock }).eq('id', id); fetchAllData(); setIsRestockOpen(false); setSelectedInventoryItem(null); 
  };

  const handleRecordWastage = async (id, wasteAmount) => {
    const { data: ingData } = await supabase.from('inventory').select('stock_qty').eq('id', id).single();
    const newStock = Number(ingData.stock_qty || 0) - Number(wasteAmount);
    await supabase.from('inventory').update({ stock_qty: newStock }).eq('id', id); fetchAllData(); setIsWastageOpen(false);
  };

  const updateProduct = async (id, updatedData) => {
    await supabase.from('products').update({ name: updatedData.name, price: parseFloat(updatedData.price), category: updatedData.category, recipe: updatedData.recipe || '' }).eq('id', id); fetchAllData(); setEditingProduct(null); 
  };

  if (!session) return showLanding ? <LandingPage onLoginClick={() => setShowLanding(false)} /> : <Auth />;
  
  const availableAddons = menuItems.filter(item => item.category === 'Add-on');
  const availableMilks = menuItems.filter(item => item.category === 'Milk');
  
  const displayedItems = activeCategory === 'All' ? menuItems.filter(i => i.category !== 'Add-on' && i.category !== 'Milk') : menuItems;

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

  return (
    <>
      {(!isOnline || pendingSalesCount > 0) && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000, background: isOnline ? '#10b981' : '#ef4444', color: '#fff', padding: '10px 20px', borderRadius: '30px', fontWeight: '800', fontSize: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px', animation: 'popIn 0.3s' }}>
          {isOnline ? (
             <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Syncing {pendingSalesCount} Orders...</>
          ) : (
             <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg> Offline Mode ({pendingSalesCount} Pending)</>
          )}
        </div>
      )}

      {!activeCashier && !showStartShift ? (
        <CashierLock onUnlock={handleCashierLogin} />
      ) : activeCashier ? (
        
        <div className="pos-container" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', backgroundColor: '#f3f4f6', overflow: 'hidden', padding: 0, margin: 0 }}>
          
          {/* HAMBURGER BUTTON FOR MOBILE */}
          <button className="mobile-nav-toggle" onClick={() => setIsMobileNavOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>

          {/* DARK OVERLAY WHEN SIDEBAR IS OPEN ON MOBILE */}
          <div className={`sidebar-overlay ${isMobileNavOpen ? 'open' : ''}`} onClick={() => setIsMobileNavOpen(false)}></div>

          <Sidebar 
            currentView={currentView} 
            setCurrentView={handleNavigationRequest} 
            activeCashier={activeCashier} 
            isMobileNavOpen={isMobileNavOpen}
            setIsMobileNavOpen={setIsMobileNavOpen}
          />
          
          <div className="main-content" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
            
            {currentView === 'Dashboard' && (
              <div style={{ flex: 1, width: '100%', height: '100%', overflowY: 'auto' }}>
                <Dashboard sales={sales} menuItems={inventory} setCurrentView={handleNavigationRequest} />
              </div>
            )}
            
            {currentView === 'Menu' && (
              <>
                <div style={{ flex: 1, height: '100%', overflowY: 'auto' }}>
                  <Menu menuItems={displayedItems} categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} addToCart={handleItemClick} onManageClick={() => setIsAddProductOpen(true)} deleteProduct={requestDeleteProduct} editProduct={setEditingProduct} />
                </div>
                
                {cart.length > 0 ? (
                  <Cart cart={cart} updateQty={updateQty} total={cart.reduce((s, i) => s + (i.price * i.qty), 0)} handleCheckout={() => cart.length > 0 && setIsCheckoutOpen(true)} discount={discount} onOpenDiscount={requestAddDiscount} />
                ) : null}
              </>
            )}

            {currentView === 'Inventory' && (
              <div style={{ flex: 1, width: '100%', height: '100%', overflowY: 'auto' }}>
                <Inventory ingredients={inventory} onRestockClick={(item) => { setSelectedInventoryItem(item); setIsRestockOpen(true); }} onAddIngredientClick={() => setIsAddIngredientOpen(true)} onWastageClick={() => setIsWastageOpen(true)} />
              </div>
            )}

            {currentView === 'Settings' && (
              <div style={{ flex: 1, width: '100%', height: '100%', overflowY: 'auto' }}>
                <Settings activeCashier={activeCashier} activeShift={activeShift} onPrepareEndShift={requestEndShift} />
              </div>
            )}

          </div>
        </div>
        
      ) : null}

      {/* MODALS */}
      {isCheckoutOpen && <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} total={cart.reduce((s, i) => s + (i.price * i.qty), 0) * (1 - discount.rate)} onConfirm={confirmPaymentAndSave} cart={cart} discount={discount} />}
      {isRestockOpen && <ManualRestock isOpen={isRestockOpen} onClose={() => { setIsRestockOpen(false); setSelectedInventoryItem(null); }} menuItems={inventory} onRestock={handleManualRestock} preselectedItem={selectedInventoryItem} />}
      {isAddProductOpen && <AddProduct onClose={() => setIsAddProductOpen(false)} addProduct={addProduct} ingredients={inventory} categories={categories.filter(c => c !== 'All')} />}
      {isAddIngredientOpen && <AddIngredient onClose={() => setIsAddIngredientOpen(false)} addIngredient={addIngredient} />}
      {isWastageOpen && <RecordWastage onClose={() => setIsWastageOpen(false)} inventory={inventory} onRecordWastage={handleRecordWastage} />}
      {editingProduct && <EditProduct isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} product={editingProduct} onUpdate={updateProduct} ingredients={inventory} categories={categories.filter(c => c !== 'All')} />}
      {isDiscountOpen && <DiscountModal onClose={() => setIsDiscountOpen(false)} applyDiscount={setDiscount} currentDiscount={discount} />}

      {modifierModal.isOpen && (
        <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '420px', borderRadius: '32px', padding: '35px', backgroundColor: '#FDFBF7', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', animation: 'popIn 0.3s' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 5px 0', color: '#3B2213', letterSpacing: '-0.5px' }}>Customize Order</h2>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#B56124' }}>
                  {modifierModal.product.name} — ₱{(modifierModal.product.price + previewExtraCost()).toFixed(2)}
                </p>
              </div>
              <button onClick={() => setModifierModal({ ...modifierModal, isOpen: false })} style={{ background: '#E6D0A9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: '#3B2213', fontSize: '20px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>

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

            {!['americano', 'espresso'].some(keyword => modifierModal.product.name.toLowerCase().includes(keyword)) && (
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Milk Option</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => setModifierModal({...modifierModal, milk: 'Whole'})} style={{ flex: 1, minWidth: '90px', padding: '10px 5px', borderRadius: '14px', border: modifierModal.milk === 'Whole' ? '2px solid #3B2213' : '2px solid #e5e7eb', background: modifierModal.milk === 'Whole' ? '#3B2213' : '#fff', color: modifierModal.milk === 'Whole' ? '#FDFBF7' : '#3B2213', fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span>Whole</span>
                  </button>

                  {availableMilks.map(milkObj => (
                    <button key={milkObj.id} onClick={() => setModifierModal({...modifierModal, milk: milkObj.name})} style={{ flex: 1, minWidth: '90px', padding: '10px 5px', borderRadius: '14px', border: modifierModal.milk === milkObj.name ? '2px solid #3B2213' : '2px solid #e5e7eb', background: modifierModal.milk === milkObj.name ? '#3B2213' : '#fff', color: modifierModal.milk === milkObj.name ? '#FDFBF7' : '#3B2213', fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: '0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span>{milkObj.name}</span>
                      <span style={{ opacity: modifierModal.milk === milkObj.name ? 0.7 : 0.5, fontSize: '11px', marginTop: '2px' }}>(+₱{milkObj.price})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '35px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Add-Ons</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {availableAddons.length > 0 ? availableAddons.map(addon => {
                  const isActive = modifierModal.addons.find(a => a.id === addon.id);
                  return (
                    <div key={addon.id} onClick={() => toggleAddon(addon)} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderRadius: '14px', border: isActive ? '2px solid #B56124' : '1px solid #e5e7eb', background: isActive ? '#FDFBF7' : '#fff', cursor: 'pointer', transition: '0.2s', boxShadow: isActive ? '0 0 0 1px #B56124' : 'none' }}>
                      <span style={{ fontWeight: '800', color: '#3B2213', fontSize: '14px' }}>{addon.name}</span>
                      <span style={{ fontWeight: '800', color: isActive ? '#B56124' : '#9ca3af', fontSize: '14px' }}>+₱{addon.price}</span>
                    </div>
                  );
                }) : (
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, fontStyle: 'italic' }}>No add-ons created yet. Add them in the Manage section.</p>
                )}
              </div>
            </div>

            <button onClick={confirmModifiersAndAddToCart} style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: '#B56124', color: '#fff', fontWeight: '900', fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(181, 97, 36, 0.25)', transition: '0.2s' }}>
              Add to Order — ₱{(modifierModal.product.price + previewExtraCost()).toFixed(2)}
            </button>
            
          </div>
        </div>
      )}

      {showStartShift && (
        <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '420px', borderRadius: '32px', padding: '40px 35px', textAlign: 'center', backgroundColor: '#E6D0A9', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', animation: 'popIn 0.3s' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#FDFBF7', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #3B2213', boxShadow: '0 8px 16px rgba(59,34,19,0.1)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 10px', color: '#3B2213', letterSpacing: '-0.5px' }}>Open Register</h2>
            <p style={{ color: '#3B2213', fontSize: '14px', marginBottom: '30px', fontWeight: '600', opacity: 0.8, lineHeight: '1.4' }}>Count the cash float in the drawer before starting your shift.</p>
            <div style={{ position: 'relative', width: '100%', marginBottom: '30px', textAlign: 'left', background: '#F5E8D2', borderRadius: '16px', border: '2px solid #3B2213', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#B56124', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Starting Cash (₱)</div>
                <input type="number" value={startingCashInput} onChange={(e) => setStartingCashInput(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '32px', fontWeight: '900', color: '#3B2213', padding: 0 }} autoFocus />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setShowStartShift(false); setPendingCashier(null); window.location.reload(); }} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#FDFBF7', color: '#3B2213', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={openRegister} disabled={!startingCashInput} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#B56124', color: '#FDFBF7', fontWeight: '900', fontSize: '15px', cursor: !startingCashInput ? 'not-allowed' : 'pointer', opacity: !startingCashInput ? 0.6 : 1, boxShadow: '0 4px 12px rgba(181, 97, 36, 0.3)' }}>Open Register</button>
            </div>
          </div>
        </div>
      )}

      {showEndShift && (
        <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '420px', borderRadius: '32px', padding: '40px 35px', textAlign: 'center', backgroundColor: '#E6D0A9', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', animation: 'popIn 0.3s' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#FDFBF7', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #3B2213', boxShadow: '0 8px 16px rgba(59,34,19,0.1)' }}>
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 10px', color: '#3B2213', letterSpacing: '-0.5px' }}>Close Register</h2>
            <p style={{ color: '#3B2213', fontSize: '14px', marginBottom: '25px', fontWeight: '600', opacity: 0.8 }}>
              Count the physical cash in the drawer to close <strong>{activeCashier?.username}</strong>'s shift.
            </p>
            <div style={{ background: '#F5E8D2', border: '2px solid #3B2213', borderRadius: '16px', padding: '15px 20px', marginBottom: '25px', textAlign: 'left' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', color: '#3B2213', fontWeight: '700', opacity: 0.8 }}>Starting Float:</span>
                  <span style={{ fontSize: '14px', color: '#3B2213', fontWeight: '800' }}>₱ {Number(activeShift?.starting_cash || 0).toFixed(2)}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', color: '#3B2213', fontWeight: '700', opacity: 0.8 }}>Shift Sales:</span>
                  <span style={{ fontSize: '14px', color: '#3B2213', fontWeight: '800' }}>+ ₱ {shiftSalesAmount.toFixed(2)}</span>
               </div>
               <div style={{ height: '2px', background: '#3B2213', opacity: 0.2, margin: '12px 0' }}></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', color: '#B56124', fontWeight: '900', textTransform: 'uppercase' }}>Total Expected:</span>
                  <span style={{ fontSize: '20px', color: '#B56124', fontWeight: '900' }}>₱ {shiftExpectedCash.toFixed(2)}</span>
               </div>
            </div>
            <div style={{ position: 'relative', width: '100%', marginBottom: '30px', textAlign: 'left', background: '#FDFBF7', borderRadius: '16px', border: '2px solid #B56124', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 0 0 3px rgba(181,97,36,0.2)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#B56124', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Actual Counted Cash (₱)</div>
                <input type="number" value={endingCashInput} onChange={(e) => setEndingCashInput(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '32px', fontWeight: '900', color: '#3B2213', padding: 0 }} autoFocus />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowEndShift(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#FDFBF7', color: '#3B2213', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={closeRegister} disabled={!endingCashInput} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#3B2213', color: '#FDFBF7', fontWeight: '900', fontSize: '15px', cursor: !endingCashInput ? 'not-allowed' : 'pointer', opacity: !endingCashInput ? 0.6 : 1, boxShadow: '0 4px 12px rgba(59,34,19,0.3)' }}>End Shift & Lock</button>
            </div>
          </div>
        </div>
      )}

      {showManagerAuth && (
        <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '420px', borderRadius: '32px', padding: '40px 35px', textAlign: 'center', backgroundColor: '#E6D0A9', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', animation: 'popIn 0.3s' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#FDFBF7', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #3B2213', boxShadow: '0 8px 16px rgba(59,34,19,0.1)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 10px', color: '#3B2213', letterSpacing: '-0.5px' }}>Manager Approval</h2>
            <p style={{ color: '#3B2213', fontSize: '14px', marginBottom: '30px', fontWeight: '600', opacity: 0.8, lineHeight: '1.4' }}>This action requires manager privileges. Please enter your 6-Digit PIN.</p>
            <input type="password" placeholder="• • • • • •" maxLength={6} value={managerPinInput} onChange={(e) => setManagerPinInput(e.target.value.replace(/[^0-9]/g, ''))} style={{ width: '100%', height: '70px', textAlign: 'center', fontSize: '40px', letterSpacing: '12px', fontWeight: '900', color: '#3B2213', borderRadius: '16px', border: '2px solid #3B2213', marginBottom: '30px', outline: 'none', backgroundColor: '#FDFBF7', boxSizing: 'border-box' }} autoFocus />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => {setShowManagerAuth(false); setPendingAction(null); setManagerPinInput("");}} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#FDFBF7', color: '#3B2213', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={executeManagerOverride} disabled={managerPinInput.length !== 6} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#B56124', color: '#FDFBF7', fontWeight: '900', fontSize: '15px', cursor: managerPinInput.length !== 6 ? 'not-allowed' : 'pointer', opacity: managerPinInput.length !== 6 ? 0.6 : 1, boxShadow: '0 4px 12px rgba(181, 97, 36, 0.3)' }}>Authorize</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;