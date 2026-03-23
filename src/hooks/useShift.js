import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SECRET_KEY = "TallyBrew@2026_SecureVault_X99!";

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
  } catch (e) { return null; }
};

export function useShift(effectiveBranch, showAlert, setCurrentView) {
  const [activeCashier, setActiveCashier] = useState(null);
  const [activeShift, setActiveShift] = useState(null);
  const [pendingCashier, setPendingCashier] = useState(null);
  const [showStartShift, setShowStartShift] = useState(false);
  const [startingCashInput, setStartingCashInput] = useState("");
  
  const [showEndShift, setShowEndShift] = useState(false);
  const [endingCashInput, setEndingCashInput] = useState("");
  
  const [shiftStats, setShiftStats] = useState(null);
  const [showShiftReport, setShowShiftReport] = useState(false);

  // CACHE ENHANCEMENT: Download profiles silently when online so CashierLock works offline
  useEffect(() => {
    const cacheProfiles = async () => {
      if (navigator.onLine) {
        const { data } = await supabase.from('profiles').select('*');
        if (data) localStorage.setItem('tb_cache_profiles', encryptData(data));
      }
    };
    cacheProfiles();
  }, []);

  const handleCashierLogin = async (cashier) => {
    try {
      if (cashier.role === 'admin' || cashier.role === 'manager') {
        setActiveCashier(cashier); setCurrentView('Dashboard'); return;
      }

      // OFFLINE ENHANCEMENT: Check local cache if internet is down
      if (!navigator.onLine) {
        const cachedShift = localStorage.getItem('tb_active_shift');
        if (cachedShift) {
          const shift = decryptData(cachedShift);
          if (shift && shift.cashier_name === cashier.username && shift.status === 'open') {
            setActiveShift(shift); setActiveCashier(cashier); setCurrentView('Menu'); return;
          }
        }
        setPendingCashier(cashier); setShowStartShift(true); return;
      }

      const { data } = await supabase.from('shifts').select('*').eq('cashier_name', cashier.username).eq('status', 'open').order('start_time', { ascending: false }).limit(1);
      if (data && data.length > 0) {
        localStorage.setItem('tb_active_shift', encryptData(data[0])); // Save shift to cache
        setActiveShift(data[0]); setActiveCashier(cashier); setCurrentView('Menu');
      } else {
        setPendingCashier(cashier); setShowStartShift(true); 
      }
    } catch(e) { 
      // Fallback if database fails
      const cachedShift = localStorage.getItem('tb_active_shift');
      if (cachedShift) {
        const shift = decryptData(cachedShift);
        if (shift && shift.cashier_name === cashier.username && shift.status === 'open') {
          setActiveShift(shift); setActiveCashier(cashier); setCurrentView('Menu'); return;
        }
      }
      showAlert("Error checking shift status."); 
    }
  };

  const openRegister = async () => {
    if (!pendingCashier) return;
    const cash = parseFloat(startingCashInput) || 0;
    
    // Create an offline-friendly shift object
    const newOfflineShift = { id: 'offline-' + Date.now(), cashier_name: pendingCashier.username, starting_cash: cash, cash_drops: 0, branch_id: effectiveBranch, status: 'open', start_time: new Date().toISOString() };

    if (!navigator.onLine) {
      localStorage.setItem('tb_active_shift', encryptData(newOfflineShift));
      setActiveShift(newOfflineShift); setActiveCashier(pendingCashier); setShowStartShift(false); setPendingCashier(null); setStartingCashInput(""); setCurrentView('Menu');
      return;
    }

    try {
      const { data, error } = await supabase.from('shifts').insert([{ cashier_name: pendingCashier.username, starting_cash: cash, cash_drops: 0, branch_id: effectiveBranch }]).select().single();
      if (error) throw error;
      if (data) {
        localStorage.setItem('tb_active_shift', encryptData(data));
        setActiveShift(data); setActiveCashier(pendingCashier); setShowStartShift(false); setPendingCashier(null); setStartingCashInput(""); setCurrentView('Menu');
      }
    } catch (err) { 
      // Fallback to offline register if save fails
      localStorage.setItem('tb_active_shift', encryptData(newOfflineShift));
      setActiveShift(newOfflineShift); setActiveCashier(pendingCashier); setShowStartShift(false); setPendingCashier(null); setStartingCashInput(""); setCurrentView('Menu');
    }
  };

  const prepareEndShift = async () => {
    let shiftSales = [];
    
    // OFFLINE ENHANCEMENT: Read sales from both Database AND Local Queue
    if (navigator.onLine) {
      const { data } = await supabase.from('sales').select('*').gte('created_at', activeShift.start_time).eq('branch_id', effectiveBranch);
      if (data) shiftSales = data;
    } else {
      const cachedSales = localStorage.getItem('tb_cache_sales');
      if (cachedSales) {
        const parsed = decryptData(cachedSales);
        if (parsed && Array.isArray(parsed)) shiftSales = parsed.filter(s => s.created_at >= activeShift.start_time);
      }
      const offlineQueue = localStorage.getItem('tallybrew_offline_queue');
      if (offlineQueue) {
        const q = decryptData(offlineQueue);
        if (q && Array.isArray(q)) {
          q.forEach(pkg => { if (pkg.sale && pkg.sale.created_at >= activeShift.start_time) shiftSales.push(pkg.sale); });
        }
      }
    }

    let totalSales = 0, cashSales = 0, gcashSales = 0, discountCount = 0;

    if (shiftSales) {
      shiftSales.forEach(sale => {
        const amount = Number(sale.total_amount || 0); totalSales += amount;
        const cAmt = Number(sale.cash_amount || 0); const gAmt = Number(sale.gcash_amount || 0);
        if (sale.payment_method === 'GCash' && cAmt === 0 && gAmt === 0) gcashSales += amount;
        else if (sale.payment_method === 'Cash' && cAmt === 0 && gAmt === 0) cashSales += amount;
        else { cashSales += cAmt; gcashSales += gAmt; }
        if (sale.items_summary && sale.items_summary.includes('(w/')) discountCount++;
      });
    }

    const expectedCash = Number(activeShift.starting_cash) + cashSales - Number(activeShift.cash_drops || 0);
    setShiftStats({ totalSales, cashSales, gcashSales, discountCount, expectedCash, startingCash: Number(activeShift.starting_cash), cashDrops: Number(activeShift.cash_drops || 0), transactions: shiftSales ? shiftSales.length : 0, startTime: activeShift.start_time });
    setShowEndShift(true);
  };

  const closeRegister = async () => {
    const actual = parseFloat(endingCashInput) || 0;
    const shortage = actual - shiftStats.expectedCash; 
    const endTime = new Date().toISOString();

    if (navigator.onLine && activeShift && activeShift.id && !activeShift.id.toString().startsWith('offline')) {
      await supabase.from('shifts').update({ end_time: endTime, expected_cash: shiftStats.expectedCash, actual_cash: actual, shortage: shortage, status: 'closed' }).eq('id', activeShift.id);
    }
    
    localStorage.removeItem('tb_active_shift'); // Clear local cache on close
    setShiftStats(prev => ({ ...prev, actualCash: actual, shortage, endTime }));
    setShowEndShift(false); setShowShiftReport(true); 
  };

  const handlePrintZReading = () => {
    const printContent = document.getElementById('printable-z-read').innerHTML;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`<html><head><title>Z-Reading</title><style>@page { margin: 0; } body { font-family: monospace; padding: 15px; margin: 0; color: #000; width: 270px; }</style></head><body>${printContent}<script>window.onload=function(){setTimeout(()=>{window.print();window.close();},250);};</script></body></html>`);
    printWindow.document.close();
  };

  const finalizeShiftAndLogout = () => {
    setShowShiftReport(false); setEndingCashInput(""); setActiveShift(null); setActiveCashier(null); window.location.reload(); 
  };

  return {
    activeCashier, setActiveCashier, activeShift, setActiveShift,
    pendingCashier, setPendingCashier, showStartShift, setShowStartShift,
    startingCashInput, setStartingCashInput, showEndShift, setShowEndShift,
    endingCashInput, setEndingCashInput, shiftStats, setShiftStats,
    showShiftReport, setShowShiftReport,
    handleCashierLogin, openRegister, prepareEndShift, closeRegister,
    handlePrintZReading, finalizeShiftAndLogout
  };
}