import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import KitchenDisplay from './components/KitchenDisplay.jsx';
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
import Transactions from './components/Transactions.jsx'; 
import GlobalAlert from './components/modals/GlobalAlert.jsx';
import ManagerAuthModal from './components/modals/ManagerAuthModal.jsx';
import ModifierModal from './components/modals/ModifierModal.jsx';
import { StartShiftModal, EndShiftModal, ShiftReportModal } from './components/modals/ShiftModals.jsx';
import { useCart } from './hooks/useCart.js';
import { useShift } from './hooks/useShift.js';
import { CartContext } from './context/CartContext.jsx';

import './App.css';

let isCloningInventory = false;
const SECRET_KEY = import.meta.env.VITE_OFFLINE_VAULT_KEY;

const encryptData = (data) => {
  const text = JSON.stringify(data); let result = '';
  for (let i = 0; i < text.length; i++) result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  return btoa(result); 
};
const decryptData = (encryptedData) => {
  try {
    const text = atob(encryptedData); let result = '';
    for (let i = 0; i < text.length; i++) result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    return JSON.parse(result);
  } catch (e) { return []; }
};

function App() {
  const [session, setSession] = useState(null); 
  const [showLanding, setShowLanding] = useState(true); 
  const [currentView, setCurrentView] = useState("Menu");
  const [isKitchenKiosk, setIsKitchenKiosk] = useState(localStorage.getItem('tallybrew_kiosk') === 'true');
  
  const activeLocation = localStorage.getItem('tallybrew_branch');
  const [adminViewBranch, setAdminViewBranch] = useState(null);
  const [empireBranches, setEmpireBranches] = useState([]);
  
  const [menuItems, setMenuItems] = useState([]);
  const [inventory, setInventory] = useState([]); 
  const [sales, setSales] = useState([]);
  const [recipes, setRecipes] = useState([]);
  
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false); 
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isWastageOpen, setIsWastageOpen] = useState(false); 
  const [isDiscountOpen, setIsDiscountOpen] = useState(false); 
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false); 
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  
  const [showManagerAuth, setShowManagerAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [managerPinInput, setManagerPinInput] = useState("");
  const [appAlert, setAppAlert] = useState({ isOpen: false, type: 'error', message: '', onConfirm: null });
  
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false); 
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSalesCount, setPendingSalesCount] = useState(0);
  const [isRecovering, setIsRecovering] = useState(window.location.hash.includes('type=recovery'));

  const categories = ["All", "Hot Coffee", "Iced Coffee", "Non-Coffee", "Frappe", "Snacks", "Rice Meals", "Add-on", "Milk"];

  const effectiveBranch = activeLocation === 'admin_remote' 
    ? (adminViewBranch || (empireBranches.length > 0 ? empireBranches[0].id : null)) 
    : activeLocation;

  const showAlert = (message, type = 'error') => setAppAlert({ isOpen: true, type, message, onConfirm: null });
  const showConfirm = (message, onConfirmCallback) => setAppAlert({ isOpen: true, type: 'confirm', message, onConfirm: onConfirmCallback });
  const closeAlert = () => setAppAlert({ ...appAlert, isOpen: false });

  const cartState = useCart(inventory, recipes, menuItems, showAlert);
  
  const { 
    cart, setCart, savedOrders, discount, setDiscount, modifierModal, setModifierModal,
    availableMilks, availableAddons, handleHoldOrder, handleResumeOrder, handleDeleteSavedOrder, 
    handleClearCart, handleItemClick, toggleAddon, confirmModifiersAndAddToCart, updateQty, previewExtraCost 
  } = cartState;

  const {
    activeCashier, setActiveCashier, activeShift, setActiveShift, pendingCashier, setPendingCashier, 
    showStartShift, setShowStartShift, startingCashInput, setStartingCashInput, showEndShift, setShowEndShift,
    endingCashInput, setEndingCashInput, shiftStats, showShiftReport, handleCashierLogin, openRegister, 
    prepareEndShift, closeRegister, handlePrintZReading, finalizeShiftAndLogout
  } = useShift(effectiveBranch, showAlert, setCurrentView);

  const getOfflineQueue = () => { try { const stored = localStorage.getItem('tallybrew_offline_queue'); if (!stored) return []; if (stored.startsWith('[')) return JSON.parse(stored); return decryptData(stored); } catch (e) { return []; } };
  const clearStuckOfflineQueue = () => { localStorage.removeItem('tallybrew_offline_queue'); setPendingSalesCount(0); showAlert("Stuck orders cleared successfully.", "confirm"); };

  const loadFromCache = () => {
    try {
      const cachedMenu = localStorage.getItem('tb_cache_menu');
      if (cachedMenu) setMenuItems(decryptData(cachedMenu));
      
      const cachedInv = localStorage.getItem('tb_cache_inv');
      if (cachedInv) setInventory(decryptData(cachedInv));
      
      const cachedRecipes = localStorage.getItem('tb_cache_recipes');
      if (cachedRecipes) setRecipes(decryptData(cachedRecipes));
      
      const cachedSales = localStorage.getItem('tb_cache_sales');
      if (cachedSales) setSales(decryptData(cachedSales));
    } catch (e) {
      console.error("Failed to load offline cache");
    }
  };

  const fetchAllData = async () => {
    if (activeLocation === 'admin_remote' && empireBranches.length === 0) {
      const { data: bData } = await supabase.from('branches').select('*').order('name');
      if (bData && bData.length > 0) { setEmpireBranches(bData); if (!adminViewBranch) setAdminViewBranch(bData[0].id); }
    }
    const { data: pData } = await supabase.from('products').select('*').order('name', { ascending: true });
    if (pData) { setMenuItems(pData); localStorage.setItem('tb_cache_menu', encryptData(pData)); }
    
    const { data: rData } = await supabase.from('recipes').select('*');
    if (rData) { setRecipes(rData); localStorage.setItem('tb_cache_recipes', encryptData(rData)); }

    if (effectiveBranch && effectiveBranch !== 'admin_remote') {
      const { data: iData } = await supabase.from('inventory').select('*').eq('branch_id', effectiveBranch).order('name', { ascending: true });
      if (iData && iData.length === 0) {
        if (!isCloningInventory) {
          isCloningInventory = true; 
          try {
            const { data: allInv } = await supabase.from('inventory').select('*');
            if (allInv) {
              const masterInv = allInv.filter(i => i.branch_id !== effectiveBranch);
              const uniqueItems = []; const map = new Map();
              masterInv.forEach(item => { if(!map.has(item.name.toLowerCase())) { map.set(item.name.toLowerCase(), true); uniqueItems.push({ name: item.name, stock_qty: 0, unit: item.unit, branch_id: effectiveBranch }); } });
              if (uniqueItems.length > 0) { 
                await supabase.from('inventory').insert(uniqueItems); 
                const { data: newIData } = await supabase.from('inventory').select('*').eq('branch_id', effectiveBranch).order('name', { ascending: true }); 
                setInventory(newIData || []); 
                if (newIData) localStorage.setItem('tb_cache_inv', encryptData(newIData));
              } else { setInventory([]); }
            }
          } catch (e) { console.error("Error cloning:", e); } finally { isCloningInventory = false; }
        }
      } else { 
        setInventory(iData || []); 
        if (iData) localStorage.setItem('tb_cache_inv', encryptData(iData));
      }
      const { data: sData } = await supabase.from('sales').select('*').eq('branch_id', effectiveBranch).order('created_at', { ascending: true });
      if (sData) { setSales(sData); localStorage.setItem('tb_cache_sales', encryptData(sData)); }
    }
  };

  useEffect(() => { const handleOnline = () => { setIsOnline(true); syncPendingQueue(); }; const handleOffline = () => setIsOnline(false); window.addEventListener('online', handleOnline); window.addEventListener('offline', handleOffline); const pending = getOfflineQueue(); setPendingSalesCount(pending.length); return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); }; }, []);
  
  useEffect(() => { 
    supabase.auth.getSession().then(({ data: { session } }) => { 
      const isOfflineVault = localStorage.getItem('tb_offline_session') === 'true';
      setSession(session || isOfflineVault); 
      if (!session && !isOfflineVault) { setActiveCashier(null); setActiveShift(null); } 
    }); 
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => { 
      if (event === 'PASSWORD_RECOVERY') setIsRecovering(true);
      if (event === 'SIGNED_OUT') localStorage.removeItem('tb_offline_session'); 
      
      const isOfflineVault = localStorage.getItem('tb_offline_session') === 'true';
      setSession(session || isOfflineVault); 
      if (!session && !isOfflineVault) { setActiveCashier(null); setActiveShift(null); } 
    }); 
    return () => subscription.unsubscribe(); 
  }, []);

  useEffect(() => { 
    if (session) {
      if (isOnline) {
        fetchAllData();
      } else {
        loadFromCache();
      }
    }
  }, [session, isOnline, adminViewBranch]);
  
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault(); document.addEventListener('contextmenu', handleContextMenu);
    const handleKeyDown = (e) => { if ( e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) || (e.ctrlKey && (e.key === 'U' || e.key === 'u')) ) { e.preventDefault(); } };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('contextmenu', handleContextMenu); document.removeEventListener('keydown', handleKeyDown); };
  }, []);

  const processOrderToSupabase = async (orderPackage) => {
    const { data: newSale, error: saleError } = await supabase.from('sales').insert([orderPackage.sale]).select().single();
    if (saleError) throw saleError;
    const getLocalInventoryId = async (globalInvId) => { const { data: origItem } = await supabase.from('inventory').select('name').eq('id', globalInvId).single(); if (!origItem) return null; const { data: localItem } = await supabase.from('inventory').select('id, stock_qty').eq('name', origItem.name).eq('branch_id', effectiveBranch).single(); return localItem ? { id: localItem.id, stock_qty: localItem.stock_qty } : null; };
    for (const cartItem of orderPackage.cart) {
      const nameParts = cartItem.name.split(' ('); const baseName = nameParts[0]; const modifiers = nameParts.length > 1 ? '(' + nameParts[1] : '';
      await supabase.from('sale_items').insert([{ sale_id: newSale.id, product_name: baseName, quantity: cartItem.qty, unit_price: cartItem.price, total_price: cartItem.price * cartItem.qty, modifiers: modifiers }]);
      const baseProductId = cartItem.id.toString().split('-')[0]; const drinkRecipe = recipes.filter(r => r.menu_item_id.toString() === baseProductId);
      for (const ingredient of drinkRecipe) { const amountToDeduct = Number(ingredient.quantity_required) * cartItem.qty; const localIng = await getLocalInventoryId(ingredient.inventory_item_id); if (localIng) { const newQty = Number(localIng.stock_qty) - amountToDeduct; await supabase.from('inventory').update({ stock_qty: newQty }).eq('id', localIng.id); } }
      if (cartItem.recipe && cartItem.recipe.startsWith('[')) { try { const recipeList = JSON.parse(cartItem.recipe); for (const req of recipeList) { const localIng = await getLocalInventoryId(req.id); if (localIng) { const newQty = Number(localIng.stock_qty) - (Number(req.qty) * Number(cartItem.qty)); await supabase.from('inventory').update({ stock_qty: newQty }).eq('id', localIng.id); } } } catch(e) {} }
    }
  };

  const syncPendingQueue = async () => { const pending = getOfflineQueue(); if (pending.length === 0) return; let remainingQueue = []; for (const order of pending) { try { await processOrderToSupabase(order); } catch (err) { remainingQueue.push(order); } } localStorage.setItem('tallybrew_offline_queue', encryptData(remainingQueue)); setPendingSalesCount(remainingQueue.length); if (remainingQueue.length === 0) fetchAllData(); };

  const confirmPaymentAndSave = async (method, receivedAmount, customerName, orderType, cashAmt = 0, gcashAmt = 0) => {
    const subtotal = cart.reduce((s, i) => s + (i.price * i.qty), 0); const finalTotal = subtotal * (1 - discount.rate);
    let itemsList = cart.map(item => `${item.qty}x ${item.name}`).join(', '); let summary = `[${orderType.toUpperCase()}] ${customerName || 'Guest'} - ${itemsList}`; if (discount.rate > 0) summary += ` (w/ ${discount.label} Discount)`;
    let finalCash = cashAmt; let finalGcash = gcashAmt; if (method === 'Cash' && finalCash === 0) finalCash = finalTotal; if (method === 'GCash' && finalGcash === 0) finalGcash = finalTotal;
    const orderPackage = { sale: { total_amount: finalTotal, items_count: cart.length, items_summary: summary, payment_method: method, cash_amount: finalCash, gcash_amount: finalGcash, kitchen_status: 'pending', branch_id: effectiveBranch, created_at: new Date().toISOString() }, cart: [...cart] };
    if (isOnline) { try { await processOrderToSupabase(orderPackage); fetchAllData(); } catch (err) { saveOffline(orderPackage); } } else { saveOffline(orderPackage); }
    setIsCheckoutOpen(false); setCart([]); setDiscount({ label: 'No Discount', rate: 0 }); 
  };

  const saveOffline = (orderPackage) => { const pending = getOfflineQueue(); pending.push(orderPackage); localStorage.setItem('tallybrew_offline_queue', encryptData(pending)); setPendingSalesCount(pending.length); };

  const handleNavigationRequest = (view) => { const role = activeCashier?.role || 'cashier'; if ((view === 'Dashboard' || view === 'Inventory' || view === 'Transactions' || view === 'Settings') && role !== 'manager' && role !== 'admin') { setPendingAction({ type: 'navigate', payload: view }); setShowManagerAuth(true); } else { setCurrentView(view); } };
  
  const requestDeleteProduct = (id) => { const role = activeCashier?.role || 'cashier'; if (role !== 'manager' && role !== 'admin') { setPendingAction({ type: 'delete', payload: id }); setShowManagerAuth(true); } else { showConfirm("Are you sure you want to delete this product? This action cannot be undone.", () => performDeleteProduct(id)); } };
  const requestAddDiscount = () => { const role = activeCashier?.role || 'cashier'; if (role !== 'manager' && role !== 'admin') { setPendingAction({ type: 'discount' }); setShowManagerAuth(true); } else { setIsDiscountOpen(true); } };
  const requestVoidSale = (sale) => { const role = activeCashier?.role || 'cashier'; if (role !== 'manager' && role !== 'admin') { setPendingAction({ type: 'void_sale', payload: sale }); setShowManagerAuth(true); } else { showConfirm(`Are you sure you want to VOID this ₱${Number(sale.total_amount).toFixed(2)} transaction? This will permanently delete the record.`, () => performVoidSale(sale)); } };
  const performVoidSale = async (sale) => { try { await supabase.from('sale_items').delete().eq('sale_id', sale.id); await supabase.from('sales').delete().eq('id', sale.id); showAlert("Transaction successfully voided.", "confirm"); fetchAllData(); } catch (err) { showAlert("Error voiding transaction: " + err.message, "error"); } };
  const performDeleteProduct = async (id) => { try { await supabase.from('products').delete().eq('id', id); fetchAllData(); } catch (error) { showAlert("Error deleting product: " + error.message, "error"); } };

  const executeManagerOverride = async () => {
    try {
      const cleanPin = String(managerPinInput).trim();
      const cleanBranch = effectiveBranch ? String(effectiveBranch).trim() : null;

      const { data, error } = await supabase.rpc('secure_manager_login', {
        entered_pin: cleanPin,
        current_branch: cleanBranch
      });

      if (error) {
        setShowManagerAuth(false); 
        showAlert(`Database Error: ${error.message}`, "error");
        setManagerPinInput("");
        return;
      }

      if (data === false) {
        setShowManagerAuth(false); 
        showAlert("Action Denied: Incorrect PIN or you do not have Manager privileges for this branch.", "error");
        setManagerPinInput("");
        return;
      }

      if (pendingAction.type === 'navigate') setCurrentView(pendingAction.payload);
      else if (pendingAction.type === 'delete') performDeleteProduct(pendingAction.payload);
      else if (pendingAction.type === 'discount') setIsDiscountOpen(true);
      else if (pendingAction.type === 'close_register') prepareEndShift(); 
      else if (pendingAction.type === 'void_sale') performVoidSale(pendingAction.payload); 
      
      setShowManagerAuth(false); 
      setPendingAction(null); 
      setManagerPinInput("");

    } catch (err) { 
      setShowManagerAuth(false); 
      showAlert("System Error connecting to database.", "error"); 
      setManagerPinInput(""); 
    }
  };
  const addProduct = async (formData, selectedFile) => {
    try {
      let image_url = '';
      if (selectedFile) { const fileExt = selectedFile.name.split('.').pop(); const fileName = `${Math.random()}.${fileExt}`; let { error: uploadError } = await supabase.storage.from('products').upload(fileName, selectedFile); if (uploadError) throw uploadError; const { data } = supabase.storage.from('products').getPublicUrl(fileName); image_url = data.publicUrl; }
      await supabase.from('products').insert([{ name: formData.name, price: parseFloat(formData.price), category: formData.category, recipe: formData.recipe, image_url: image_url }]);
      fetchAllData(); setIsAddProductOpen(false);
    } catch (error) { showAlert("Error adding product: " + error.message, "error"); }
  };

  const addIngredient = async (formData) => { try { await supabase.from('inventory').insert([{ name: formData.name, stock_qty: parseFloat(formData.stock_qty), unit: formData.unit, branch_id: effectiveBranch }]); fetchAllData(); setIsAddIngredientOpen(false); } catch (error) { showAlert("Error adding ingredient: " + error.message, "error"); } };
  const handleManualRestock = async (id, newStock, invoiceData) => { await supabase.from('inventory').update({ stock_qty: newStock }).eq('id', id); fetchAllData(); setIsRestockOpen(false); setSelectedInventoryItem(null); };
  const handleRecordWastage = async (id, wasteAmount) => { const { data: ingData } = await supabase.from('inventory').select('stock_qty').eq('id', id).single(); const newStock = Number(ingData.stock_qty || 0) - Number(wasteAmount); await supabase.from('inventory').update({ stock_qty: newStock }).eq('id', id); fetchAllData(); setIsWastageOpen(false); };
  const updateProduct = async (id, updatedData) => { await supabase.from('products').update({ name: updatedData.name, price: parseFloat(updatedData.price), category: updatedData.category, recipe: updatedData.recipe || '' }).eq('id', id); fetchAllData(); setEditingProduct(null); };

  if (isRecovering) return <Auth isRecovering={true} onRecoveryComplete={() => { setIsRecovering(false); window.location.hash = ''; window.location.reload(); }} />;
  if (!session) return showLanding ? <LandingPage onLoginClick={() => setShowLanding(false)} /> : <Auth />;
  
  // --- THE MINIMIZE KITCHEN SCREEN VIEW ---
  if (isKitchenKiosk) return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column', zIndex: 9999 }}>
      <button 
        onClick={() => { setIsKitchenKiosk(false); localStorage.removeItem('tallybrew_kiosk'); }} 
        className="no-print" 
        style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10000, padding: '12px 20px', borderRadius: '12px', border: 'none', backgroundColor: '#3B2213', color: '#E6D0A9', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 15px rgba(59,34,19,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>
        Exit Kitchen Mode
      </button>
      <KitchenDisplay />
    </div>
  );

  const displayedItems = activeCategory === 'All' ? menuItems.filter(i => i.category !== 'Add-on' && i.category !== 'Milk') : menuItems;

  return (
    <CartContext.Provider value={cartState}>
      <style>{`
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: none !important;
          height: 100% !important;
          background-color: #f3f4f6 !important;
          text-align: left !important;
        }

        * { -webkit-touch-callout: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; touch-action: manipulation; }
        input, textarea, select { -webkit-user-select: auto; -moz-user-select: auto; -ms-user-select: auto; user-select: auto; }
        button { -webkit-tap-highlight-color: transparent !important; transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.1s, box-shadow 0.1s ease !important; }
        button:active:not(:disabled) { transform: scale(0.95) !important; opacity: 0.85 !important; }
        button:disabled { cursor: not-allowed !important; }
        .popup-overlay > div { width: 92% !important; max-width: 420px !important; max-height: 90vh !important; overflow-y: auto !important; box-sizing: border-box !important; }
        .popup-overlay > div::-webkit-scrollbar { display: none; } .popup-overlay > div { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 600px) { .main-content > div { padding: 15px !important; } .kpi-grid { grid-template-columns: 1fr !important; } }
        .responsive-cart-wrapper { height: 100%; z-index: 1000; background: #fff; display: flex; flex-direction: column; } .mobile-cart-fab { display: none; } .mobile-cart-close-btn { display: none; }
        
        .admin-banner-wrapper {
          background-color: #f3f4f6; 
          padding: 20px 24px 0 24px;
          display: flex;
          align-items: center;
          justify-content: center; 
          flex-shrink: 0;
          z-index: 10;
        }
        .admin-banner-content {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #ffffff;
          padding: 10px 20px;
          border-radius: 16px;
          border: 1px solid #E6D0A9;
          box-shadow: 0 4px 15px rgba(59, 34, 19, 0.04);
          width: fit-content;
        }

        /* FIX: Ensures desktop cart maintains fixed width alongside the menu */
        @media (min-width: 851px) { 
          .mobile-only-overlay { display: none !important; } 
          .responsive-cart-wrapper { 
            width: 380px !important; 
            min-width: 380px !important; 
            border-left: 1px solid #e5e7eb; 
          }
        }

        @media (max-width: 850px) {
          .scroll-container { padding-top: 85px !important; }
          .responsive-cart-wrapper { position: fixed; top: 0; right: -100%; width: 85% !important; max-width: 400px; transition: right 0.3s ease; box-shadow: -5px 0 25px rgba(0,0,0,0.2); }
          .responsive-cart-wrapper.open { right: 0; }
          .mobile-cart-fab { display: flex; position: fixed; bottom: 25px; right: 25px; background: #3B2213; color: #fff; padding: 16px 24px; border-radius: 30px; font-size: 15px; font-weight: 900; box-shadow: 0 8px 20px rgba(59,34,19,0.4); border: 2px solid #E6D0A9; z-index: 998; align-items: center; gap: 10px; cursor: pointer; }
          .mobile-cart-close-btn { display: flex; background: #3B2213; color: #E6D0A9; border: none; padding: 15px 25px; font-weight: 900; font-size: 16px; text-transform: uppercase; cursor: pointer; align-items: center; justify-content: flex-start; gap: 10px; }
          .mobile-only-overlay { display: block !important; }

          .admin-banner-wrapper {
            justify-content: flex-start;
            padding: 15px 15px 0 70px; 
          }
          .admin-banner-content {
            width: 100%;
            padding: 8px 15px;
          }
          
          .has-admin-banner .scroll-container { 
            padding-top: 15px !important; 
          }
        }
      `}</style>

      {(!isOnline || pendingSalesCount > 0) && (
        <div className="no-print" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000, background: isOnline ? '#10b981' : '#ef4444', color: '#fff', padding: '10px 20px', borderRadius: '30px', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', animation: 'popIn 0.3s' }}>
          {isOnline ? ( <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Syncing {pendingSalesCount} Orders...<button onClick={clearStuckOfflineQueue} style={{ marginLeft: '10px', background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Clear Stuck Orders</button></> ) : ( <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg> Offline Mode ({pendingSalesCount} Pending)</> )}
        </div>
      )}

      {!activeCashier && !showStartShift ? (
        <div className="no-print"><CashierLock onUnlock={handleCashierLogin} onLaunchKitchen={() => { setIsKitchenKiosk(true); localStorage.setItem('tallybrew_kiosk', 'true'); }} /></div>
      ) : activeCashier ? (
        <div className="pos-container no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
          <button className="mobile-nav-toggle" onClick={() => setIsMobileNavOpen(true)}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button>
          <div className={`sidebar-overlay ${isMobileNavOpen ? 'open' : ''}`} onClick={() => setIsMobileNavOpen(false)}></div>
          
          <Sidebar currentView={currentView} setCurrentView={handleNavigationRequest} activeCashier={activeCashier} isMobileNavOpen={isMobileNavOpen} setIsMobileNavOpen={setIsMobileNavOpen} activeShift={activeShift} />
          
          <div 
            className={`main-content ${activeLocation === 'admin_remote' && currentView !== 'Dashboard' ? 'has-admin-banner' : ''}`} 
            style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', position: 'relative' }}
          >
            
            {activeCashier && activeLocation === 'admin_remote' && currentView !== 'Dashboard' && empireBranches.length > 0 && (
              <div className="admin-banner-wrapper no-print">
                <div className="admin-banner-content">
                  <span style={{ fontSize: '18px' }}>📍</span>
                  <span style={{ fontSize: '12px', fontWeight: '900', color: '#B56124', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Editing:</span>
                  <select 
                    value={adminViewBranch || ''} 
                    onChange={(e) => setAdminViewBranch(e.target.value)} 
                    style={{ flex: 1, background: 'transparent', border: 'none', color: '#3B2213', fontSize: '15px', fontWeight: '900', outline: 'none', cursor: 'pointer', textOverflow: 'ellipsis' }}
                  >
                    {empireBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            {currentView === 'Dashboard' && <div className="scroll-container" style={{ flex: 1, width: '100%', height: '100%', overflowY: 'auto', paddingTop: '0px' }}><Dashboard sales={sales} menuItems={inventory} setCurrentView={handleNavigationRequest} /></div>}
            
            {/* --- THE MAXIMIZE KITCHEN SCREEN VIEW --- */}
            {currentView === 'Kitchen' && (
              <div className="scroll-container" style={{ flex: 1, width: '100%', height: '100%', overflowY: 'auto', paddingTop: '0px', position: 'relative' }}>
                <button 
                  onClick={() => { setIsKitchenKiosk(true); localStorage.setItem('tallybrew_kiosk', 'true'); }} 
                  className="no-print" 
                  style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100, background: '#3B2213', color: '#E6D0A9', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(59,34,19,0.3)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                  </svg>
                  Maximize Screen
                </button>
                <KitchenDisplay />
              </div>
            )}
            
            {/* THE FIX: Re-wrapped Menu and Cart inside a flex row so they sit side-by-side perfectly on desktop */}
            {currentView === 'Menu' && (
              <div style={{ display: 'flex', flexDirection: 'row', flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
                <div className="scroll-container" style={{ flex: 1, height: '100%', overflowY: 'auto', paddingTop: '0px', paddingBottom: '100px' }}>
                  <Menu menuItems={displayedItems} categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} addToCart={handleItemClick} onManageClick={() => setIsAddProductOpen(true)} deleteProduct={requestDeleteProduct} editProduct={setEditingProduct} inventory={inventory} recipes={recipes} />
                </div>
                {isMobileCartOpen && ( <div onClick={() => setIsMobileCartOpen(false)} style={{position: 'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(59, 34, 19, 0.6)', backdropFilter: 'blur(3px)', zIndex: 999}} className="mobile-only-overlay"></div> )}
                {(cart.length > 0 || savedOrders.length > 0 || isMobileCartOpen) && (
                  <div className={`responsive-cart-wrapper ${isMobileCartOpen ? 'open' : ''}`}>
                     <button onClick={() => setIsMobileCartOpen(false)} className="mobile-cart-close-btn"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>Close Cart</button>
                     {(cart.length > 0 || savedOrders.length > 0) ? (
                       <Cart cart={cart} updateQty={updateQty} total={cart.reduce((s, i) => s + (i.price * i.qty), 0)} handleCheckout={() => cart.length > 0 && setIsCheckoutOpen(true)} discount={discount} onOpenDiscount={requestAddDiscount} savedOrders={savedOrders} onHoldOrder={handleHoldOrder} onResumeOrder={handleResumeOrder} onDeleteSavedOrder={handleDeleteSavedOrder} onClearCart={handleClearCart} showAlert={showAlert} />
                     ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', textAlign: 'center', opacity: 0.6 }}><svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#3B2213" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg><h2 style={{ fontSize: '22px', fontWeight: '900', color: '#3B2213', margin: '0 0 10px 0' }}>No Orders Yet</h2><p style={{ fontSize: '15px', fontWeight: '600', color: '#3B2213', margin: 0 }}>Tap on menu items to start building your cart.</p></div>
                     )}
                  </div>
                )}
                <button className="mobile-cart-fab no-print" onClick={() => setIsMobileCartOpen(true)}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>View Cart ({cart.reduce((sum, item) => sum + item.qty, 0)})</button>
              </div>
            )}
            
            {currentView === 'Transactions' && <div className="scroll-container" style={{ flex: 1, width: '100%', height: '100%', overflowY: 'auto', paddingTop: '0px' }}><Transactions sales={sales} onVoidSale={requestVoidSale} activeCashier={activeCashier} /></div>}
            
            {currentView === 'Inventory' && <div className="scroll-container" style={{ flex: 1, width: '100%', height: '100%', overflowY: 'auto', paddingTop: '0px' }}><Inventory ingredients={inventory} onRestockClick={(item) => { setSelectedInventoryItem(item); setIsRestockOpen(true); }} onAddIngredientClick={() => setIsAddIngredientOpen(true)} onWastageClick={() => setIsWastageOpen(true)} /></div>}
            
            {currentView === 'Settings' && <div className="scroll-container" style={{ flex: 1, width: '100%', height: '100%', overflowY: 'auto', paddingTop: '0px' }}><Settings activeCashier={activeCashier} activeShift={activeShift} onUpdateShift={setActiveShift} onPrepareEndShift={prepareEndShift} branchId={effectiveBranch} /></div>}
          
          </div>
        </div>
      ) : null}

      <GlobalAlert appAlert={appAlert} closeAlert={closeAlert} />
      <ManagerAuthModal showManagerAuth={showManagerAuth} setShowManagerAuth={setShowManagerAuth} managerPinInput={managerPinInput} setManagerPinInput={setManagerPinInput} executeManagerOverride={executeManagerOverride} setPendingAction={setPendingAction} />
      <ModifierModal modifierModal={modifierModal} setModifierModal={setModifierModal} availableMilks={availableMilks} availableAddons={availableAddons} previewExtraCost={previewExtraCost} toggleAddon={toggleAddon} confirmModifiersAndAddToCart={confirmModifiersAndAddToCart} />
      <StartShiftModal showStartShift={showStartShift} setShowStartShift={setShowStartShift} setPendingCashier={setPendingCashier} startingCashInput={startingCashInput} setStartingCashInput={setStartingCashInput} openRegister={openRegister} />
      <EndShiftModal showEndShift={showEndShift} setShowEndShift={setShowEndShift} shiftStats={shiftStats} activeCashier={activeCashier} endingCashInput={endingCashInput} setEndingCashInput={setEndingCashInput} closeRegister={closeRegister} />
      <ShiftReportModal showShiftReport={showShiftReport} shiftStats={shiftStats} activeCashier={activeCashier} handlePrintZReading={handlePrintZReading} finalizeShiftAndLogout={finalizeShiftAndLogout} baseUrl={import.meta.env.BASE_URL} />

      {isCheckoutOpen && <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} total={cart.reduce((s, i) => s + (i.price * i.qty), 0) * (1 - discount.rate)} onConfirm={confirmPaymentAndSave} cart={cart} discount={discount} />}
      {isRestockOpen && <ManualRestock isOpen={isRestockOpen} onClose={() => { setIsRestockOpen(false); setSelectedInventoryItem(null); }} menuItems={inventory} onRestock={handleManualRestock} preselectedItem={selectedInventoryItem} />}
      {isAddProductOpen && <AddProduct onClose={() => setIsAddProductOpen(false)} addProduct={addProduct} ingredients={inventory} categories={categories.filter(c => c !== 'All')} />}
      {isAddIngredientOpen && <AddIngredient onClose={() => setIsAddIngredientOpen(false)} addIngredient={addIngredient} />}
      {isWastageOpen && <RecordWastage onClose={() => setIsWastageOpen(false)} inventory={inventory} onRecordWastage={handleRecordWastage} />}
      {editingProduct && <EditProduct isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} product={editingProduct} onUpdate={updateProduct} ingredients={inventory} categories={categories.filter(c => c !== 'All')} />}
      {isDiscountOpen && <DiscountModal onClose={() => setIsDiscountOpen(false)} applyDiscount={setDiscount} currentDiscount={discount} />}
    </CartContext.Provider>
  );
}

export default App;