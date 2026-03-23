import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

export default function Dashboard({ sales = [], menuItems = [] }) {
  const [timeFilter, setTimeFilter] = useState('Today');
  
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(localStorage.getItem('tallybrew_branch') || 'All');
  const [activeSales, setActiveSales] = useState(sales);
  const [activeInventory, setActiveInventory] = useState(menuItems);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      const { data } = await supabase.from('branches').select('*').order('name');
      if (data) setBranches(data);
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    const localBranch = localStorage.getItem('tallybrew_branch');
    
    if (selectedBranch === localBranch) {
      setActiveSales(sales);
      setActiveInventory(menuItems);
      return;
    }

    const fetchRemoteData = async () => {
      setIsLoading(true);
      let salesQuery = supabase.from('sales').select('*');
      let invQuery = supabase.from('inventory').select('*');

      if (selectedBranch !== 'All') {
        salesQuery = salesQuery.eq('branch_id', selectedBranch);
        invQuery = invQuery.eq('branch_id', selectedBranch);
      }

      const [sRes, iRes] = await Promise.all([salesQuery, invQuery]);
      if (sRes.data) setActiveSales(sRes.data);
      if (iRes.data) setActiveInventory(iRes.data);
      setIsLoading(false);
    };

    fetchRemoteData();
  }, [selectedBranch, sales, menuItems]);

  const filteredSales = useMemo(() => {
    const now = new Date();
    return activeSales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      if (timeFilter === 'Today') return saleDate.toDateString() === now.toDateString();
      if (timeFilter === 'This Week') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return saleDate >= sevenDaysAgo;
      }
      if (timeFilter === 'This Month') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return saleDate >= thirtyDaysAgo;
      }
      return true; 
    });
  }, [activeSales, timeFilter]);

  const totalSales = filteredSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const ordersServed = filteredSales.length;

  const topSeller = useMemo(() => {
    const counts = {};
    filteredSales.forEach(sale => {
      if (sale.items_summary) {
        sale.items_summary.split(', ').forEach(part => {
          const match = part.match(/(\d+)x (.+)/);
          if (match) {
            const qty = parseInt(match[1]);
            const name = match[2];
            counts[name] = (counts[name] || 0) + qty;
          }
        });
      }
    });
    if (Object.keys(counts).length === 0) return "N/A";
    return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
  }, [filteredSales]);

  const lowStockCount = activeInventory.filter(item => (item.stock_qty || 0) <= 10).length;

  const weeklyChartData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() - i);
      const dateString = targetDate.toDateString();
      
      const daySales = activeSales.filter(s => new Date(s.created_at).toDateString() === dateString);
      const dailyTotal = daySales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
      
      data.push({
        day: targetDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        total: dailyTotal
      });
    }
    return data;
  }, [activeSales]);

  const maxChartValue = Math.max(...weeklyChartData.map(d => d.total), 1);


  const handleExport = async () => {
    setIsExporting(true);

    try {
      let shiftQuery = supabase.from('shifts').select('*').order('created_at', { ascending: false });
      if (selectedBranch !== 'All') {
        shiftQuery = shiftQuery.eq('branch_id', selectedBranch);
      }
      const { data: rawShifts } = await shiftQuery;

      const now = new Date();
      const filteredShifts = (rawShifts || []).filter(shift => {
        const shiftDate = new Date(shift.created_at);
        if (timeFilter === 'Today') return shiftDate.toDateString() === now.toDateString();
        if (timeFilter === 'This Week') {
          const seven = new Date(); seven.setDate(now.getDate() - 7);
          return shiftDate >= seven;
        }
        if (timeFilter === 'This Month') {
          const thirty = new Date(); thirty.setDate(now.getDate() - 30);
          return shiftDate >= thirty;
        }
        return true;
      });

      const avgOrderValue = ordersServed > 0 ? (totalSales / ordersServed) : 0;
      const totalItemsSold = filteredSales.reduce((sum, s) => sum + Number(s.items_count || 0), 0);
      
      let totalCashReceived = 0;
      let totalGCashReceived = 0;
      let dineInCount = 0;
      let takeoutCount = 0;
      let discountedOrders = 0;
      
      const itemCounts = {};
      const uniqueCustomers = new Set();

      filteredSales.forEach(s => {
        const amount = Number(s.total_amount || 0);
        const cAmt = Number(s.cash_amount || 0);
        const gAmt = Number(s.gcash_amount || 0);

        if (s.payment_method === 'GCash' && cAmt === 0 && gAmt === 0) totalGCashReceived += amount;
        else if (s.payment_method === 'Cash' && cAmt === 0 && gAmt === 0) totalCashReceived += amount;
        else { totalCashReceived += cAmt; totalGCashReceived += gAmt; }

        const summary = s.items_summary || '';
        if (summary.includes('DINE-IN')) dineInCount++;
        if (summary.includes('TAKEOUT') || summary.includes('TAKE-OUT')) takeoutCount++;
        if (summary.includes('(w/')) discountedOrders++;

        let orderTypeMatch = summary.match(/\[(.*?)\]/);
        let pureItems = summary;
        let customerName = "Guest";

        if (orderTypeMatch) {
          pureItems = pureItems.replace(`[${orderTypeMatch[1]}] `, '');
        }

        const customerSplit = pureItems.split(' - ');
        if (customerSplit.length > 1) {
          customerName = customerSplit[0].replace(/\s*\(Ref:.*?\)/, '').trim();
          pureItems = customerSplit.slice(1).join(' - ');
        }
        
        if (customerName && customerName !== 'Guest') {
          uniqueCustomers.add(customerName);
        }

        pureItems = pureItems.replace(/\(w\/.*?Discount\)/g, '');
        pureItems.split(', ').forEach(part => {
          const match = part.match(/(\d+)x (.+)/);
          if (match) {
            const qty = parseInt(match[1]);
            const name = match[2].trim();
            itemCounts[name] = (itemCounts[name] || 0) + qty;
          }
        });
      });

      const cashPct = totalSales > 0 ? ((totalCashReceived / totalSales) * 100).toFixed(1) : 0;
      const gcashPct = totalSales > 0 ? ((totalGCashReceived / totalSales) * 100).toFixed(1) : 0;
      const sortedTopItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);
      const branchName = selectedBranch === 'All' ? 'ALL BRANCHES' : (branches.find(b => b.id === selectedBranch)?.name || 'STORE');

      const escapeCSV = (val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) return `"${str.replace(/"/g, '""')}"`;
        return str;
      };

      let csv = '\uFEFF'; 
      
      csv += "TALLYBREW_POS_ANALYTICS_MASTER_EXECUTIVE_REPORT,,,,,\n";
      csv += `Generated On:,${escapeCSV(new Date().toLocaleString())},,,,\n`;
      csv += `Location Filter:,${escapeCSV(branchName.toUpperCase())},,,,\n`;
      csv += `Time Filter:,${escapeCSV(timeFilter.toUpperCase())},,,,\n`;
      csv += ",,,,,\n";

      csv += "--- 1. EXECUTIVE SUMMARY ---,,,,,\n";
      csv += "Total Gross Revenue,Total Transactions,Avg Order Value,Total Items Sold,Dine-In Orders,Take-Out Orders,Discounted Orders,Unique Customers\n";
      csv += `${totalSales.toFixed(2)},${ordersServed},${avgOrderValue.toFixed(2)},${totalItemsSold},${dineInCount},${takeoutCount},${discountedOrders},${uniqueCustomers.size}\n`;
      csv += ",,,,,\n"; 

      csv += "--- 2. REVENUE BY PAYMENT METHOD ---,,,,,\n";
      csv += "Payment Method,Total Received (PHP),Percentage of Sales,,,\n";
      csv += `Physical Cash,${totalCashReceived.toFixed(2)},${cashPct}%,,,\n`;
      csv += `GCash Transfers,${totalGCashReceived.toFixed(2)},${gcashPct}%,,,\n`;
      csv += ",,,,,\n";

      csv += "--- 3. Z-REPORT & SHIFT LOGS ---,,,,,\n";
      csv += "Branch,Cashier Name,Clock In,Clock Out,Starting Float,Cash Dropped (Skim),Expected Drawer,Actual Drawer,Discrepancy\n";
      if (filteredShifts.length === 0) {
        csv += "No shift records found for this period.,,,,,,,\n";
      } else {
        filteredShifts.forEach(shift => {
          const bName = branches.find(b => b.id === shift.branch_id)?.name || 'Unknown';
          const clockIn = new Date(shift.start_time).toLocaleString();
          const clockOut = shift.end_time ? new Date(shift.end_time).toLocaleString() : 'STILL ACTIVE';
          const exp = Number(shift.expected_cash || 0);
          const act = Number(shift.actual_cash || 0);
          const short = Number(shift.shortage || 0);
          const drop = Number(shift.cash_drops || 0);
          
          let discrepancy = 'Perfect';
          if (short < 0) discrepancy = `SHORT: ${Math.abs(short).toFixed(2)}`;
          if (short > 0) discrepancy = `OVER: ${short.toFixed(2)}`;

          csv += `${escapeCSV(bName)},${escapeCSV(shift.cashier_name)},${escapeCSV(clockIn)},${escapeCSV(clockOut)},${Number(shift.starting_cash || 0).toFixed(2)},${drop.toFixed(2)},${exp.toFixed(2)},${act.toFixed(2)},${escapeCSV(discrepancy)}\n`;
        });
      }
      csv += ",,,,,,,,\n";

      csv += "--- 4. PRODUCT PERFORMANCE (ITEMS SOLD) ---,,,,,\n";
      csv += "Rank,Item Name,Quantity Sold,,,\n";
      if (sortedTopItems.length === 0) {
        csv += "-,No items sold in this period.,,,,\n";
      } else {
        sortedTopItems.forEach(([name, qty], index) => {
          csv += `${index + 1},${escapeCSV(name)},${qty},,,\n`;
        });
      }
      csv += ",,,,,\n";

      csv += "--- 5. COMPLETE INVENTORY AUDIT ---,,,,,\n";
      csv += "Branch Location,Ingredient / Item Name,Current Stock Level,Unit,Status Warning\n";
      const sortedInventory = [...activeInventory].sort((a, b) => Number(a.stock_qty || 0) - Number(b.stock_qty || 0));
      sortedInventory.forEach(item => {
        const stock = Number(item.stock_qty || 0);
        let status = 'Healthy';
        if (stock <= 0) status = 'OUT OF STOCK';
        else if (stock <= 10) status = 'CRITICAL - RESTOCK NOW';
        else if (stock <= 30) status = 'Low Stock';

        const itemBranchName = branches.find(b => b.id === item.branch_id)?.name || 'Unknown';
        csv += `${escapeCSV(itemBranchName)},${escapeCSV(item.name)},${stock},${escapeCSV(item.unit)},${escapeCSV(status)}\n`;
      });
      if (sortedInventory.length === 0) csv += "-,No inventory data available.,,,,\n";
      csv += ",,,,,\n";

      csv += "--- 6. MASTER TRANSACTION LEDGER ---,,,,,\n";
      csv += "Branch,Date,Time,Order ID,Customer Name,Order Type,Primary Method,Total Amount (PHP),Cash Part (PHP),GCash Part (PHP),Discount Applied,Items Breakdown\n";
      
      if (filteredSales.length === 0) {
        csv += "No transactions found for this period.,,,,,\n";
      } else {
        const sortedSales = [...filteredSales].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        sortedSales.forEach(s => {
          const dateObj = new Date(s.created_at);
          const date = dateObj.toLocaleDateString();
          const time = dateObj.toLocaleTimeString();
          
          let method = s.payment_method || 'Cash';
          let displayMethod = method;
          if (method === 'GCash') {
             const match = s.items_summary?.match(/\(Ref: (\d+)\)/);
             if (match) displayMethod = `GCash (Ref: ${match[1]})`;
          }

          let orderType = "Unknown";
          let customerName = "Guest";
          let discountType = "None";
          let pureItems = s.items_summary || "No details";

          const typeMatch = pureItems.match(/\[(.*?)\]/);
          if (typeMatch) {
            orderType = typeMatch[1];
            pureItems = pureItems.replace(`[${orderType}] `, '');
          }

          const customerSplit = pureItems.split(' - ');
          if (customerSplit.length > 1) {
            customerName = customerSplit[0].replace(/\s*\(Ref:.*?\)/, '').trim(); 
            pureItems = customerSplit.slice(1).join(' - ');
          }

          const discountMatch = pureItems.match(/\(w\/ (.*?) Discount\)/);
          if (discountMatch) {
            discountType = discountMatch[1];
            pureItems = pureItems.replace(`(w/ ${discountType} Discount)`, '').trim();
          }

          const saleBranchName = branches.find(b => b.id === s.branch_id)?.name || 'Unknown';
          const amt = Number(s.total_amount || 0);
          let cAmt = Number(s.cash_amount || 0);
          let gAmt = Number(s.gcash_amount || 0);
          
          if (method === 'Cash' && cAmt === 0 && gAmt === 0) cAmt = amt;
          if (method === 'GCash' && cAmt === 0 && gAmt === 0) gAmt = amt;

          csv += `${escapeCSV(saleBranchName)},${escapeCSV(date)},${escapeCSV(time)},${escapeCSV(s.id)},${escapeCSV(customerName)},${escapeCSV(orderType)},${escapeCSV(displayMethod)},${amt.toFixed(2)},${cAmt.toFixed(2)},${gAmt.toFixed(2)},${escapeCSV(discountType)},${escapeCSV(pureItems)}\n`;
        });
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const safeDate = new Date().toISOString().split('T')[0];
      const safeBranch = branchName.replace(/\s+/g, '_');
      link.download = `TallyBrew_GOD_REPORT_${safeBranch}_${timeFilter.replace(/\s+/g, '_')}_${safeDate}.csv`;
      link.click();

    } catch (err) {
      alert("Error generating God Report: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    
    <div className="dashboard-container" style={{ width: '100%', boxSizing: 'border-box', padding: 'clamp(15px, 4vw, 40px)', position: 'relative' }}>
      
      {(isLoading || isExporting) && (
        <div style={{ position: 'absolute', top: '10px', right: 'clamp(15px, 4vw, 40px)', background: '#B56124', color: '#fff', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', animation: 'pulse 1.5s infinite', zIndex: 100, boxShadow: '0 4px 10px rgba(181, 97, 36, 0.3)' }}>
          {isExporting ? 'Generating Report...' : 'Fetching Data...'}
        </div>
      )}

      {}
      <div className="dashboard-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: 'clamp(20px, 4vw, 35px)' }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 25px)', fontWeight: '900', color: '#111', letterSpacing: '-0.5px' }}>Store Performance</h1>
        
        <div className="header-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', width: '100%', maxWidth: 'max-content' }}>
          <select 
            className="filter-btn" 
            value={selectedBranch} 
            onChange={(e) => setSelectedBranch(e.target.value)}
            style={{ flex: '1 1 auto', padding: '10px 14px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', fontWeight: '800', outline: 'none', cursor: 'pointer', backgroundColor: '#fff' }}
          >
            <option value="All">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select 
            className="filter-btn" 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value)}
            style={{ flex: '1 1 auto', padding: '10px 14px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '14px', fontWeight: '700', outline: 'none', cursor: 'pointer', backgroundColor: '#fff' }}
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="All Time">All Time</option>
          </select>
          
          <button className="export-btn" onClick={handleExport} disabled={isExporting} style={{ flex: '1 1 auto', padding: '10px 16px', borderRadius: '10px', cursor: isExporting ? 'not-allowed' : 'pointer', border: 'none', backgroundColor: '#3B2213', color: '#fff', fontSize: '14px', fontWeight: '800', boxShadow: '0 4px 10px rgba(59, 34, 19, 0.2)', transition: 'transform 0.1s', opacity: isExporting ? 0.7 : 1, whiteSpace: 'nowrap' }} onMouseDown={(e)=> !isExporting && (e.target.style.transform='scale(0.95)')} onMouseUp={(e)=>!isExporting && (e.target.style.transform='scale(1)')}>
            {isExporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      {}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: 'clamp(25px, 5vw, 40px)' }}>
        
        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', padding: '20px', borderRadius: '16px', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
          <div className="kpi-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span className="kpi-icon icon-green" style={{ fontSize: '20px', fontWeight: '900', color: '#10b981' }}>₱</span>
            <span className="badge badge-green" style={{ background: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>Live</span>
          </div>
          <div className="kpi-label" style={{ color: '#6b7280', fontSize: '12px', marginBottom: '5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sales ({timeFilter})</div>
          <div className="kpi-value" style={{ fontSize: 'clamp(24px, 4vw, 28px)', fontWeight: '900', color: '#111' }}>₱{totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', padding: '20px', borderRadius: '16px', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
          <div className="kpi-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span className="kpi-icon icon-blue" style={{ fontSize: '20px' }}>🛒</span>
            <span className="badge badge-green" style={{ background: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>Live</span>
          </div>
          <div className="kpi-label" style={{ color: '#6b7280', fontSize: '12px', marginBottom: '5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Orders Served</div>
          <div className="kpi-value" style={{ fontSize: 'clamp(24px, 4vw, 28px)', fontWeight: '900', color: '#111' }}>{ordersServed}</div>
        </div>

        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', padding: '20px', borderRadius: '16px', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
          <div className="kpi-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span className="kpi-icon icon-orange" style={{ fontSize: '20px', color: '#f59e0b', fontWeight: '900' }}>↗</span>
            <span className="badge badge-gray" style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>Live</span>
          </div>
          <div className="kpi-label" style={{ color: '#6b7280', fontSize: '12px', marginBottom: '5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Seller ({timeFilter})</div>
          <div className="kpi-value" style={{ fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: '900', color: '#111', wordBreak: 'break-word', lineHeight: '1.2' }}>{topSeller}</div>
        </div>

        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', padding: '20px', borderRadius: '16px', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
          <div className="kpi-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span className="kpi-icon icon-red" style={{ fontSize: '20px', color: '#ef4444', fontWeight: '900' }}>⚠</span>
            <span className="badge badge-gray" style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>Live</span>
          </div>
          <div className="kpi-label" style={{ color: '#6b7280', fontSize: '12px', marginBottom: '5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Low Stock Items</div>
          <div className="kpi-value" style={{ fontSize: 'clamp(24px, 4vw, 28px)', fontWeight: '900', color: lowStockCount > 0 ? '#ef4444' : '#111' }}>
            {lowStockCount}
          </div>
        </div>
      </div>

      {}
      <div className="chart-section" style={{ width: '100%', paddingBottom: '15px' }}>
        <h2 className="chart-title" style={{ marginBottom: '20px', fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: '900', color: '#111', textAlign: 'left' }}>Sales Trend (Last 7 Days)</h2>
        
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '20px' }}>
          <div className="trend-chart-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '250px', minWidth: '450px', padding: '20px', border: '2px dashed #e5e7eb', borderRadius: '20px', backgroundColor: '#fff' }}>
            {weeklyChartData.map((d, i) => (
              <div key={i} className="trend-bar-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <span className="trend-tooltip" style={{ fontSize: '12px', marginBottom: '8px', color: '#6b7280', fontWeight: '700' }}>₱{d.total.toFixed(0)}</span>
                
                <div 
                  className="trend-bar" 
                  style={{ 
                    height: `${(d.total / maxChartValue) * 100}%`, 
                    minHeight: d.total > 0 ? '6px' : '3px',
                    width: 'clamp(30px, 4vw, 45px)', 
                    backgroundColor: '#B56124',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.3s ease'
                  }}
                ></div>
                <span className="trend-label" style={{ marginTop: '10px', fontSize: '12px', fontWeight: '800', color: '#9ca3af' }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}