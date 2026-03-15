import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

export default function Dashboard({ sales = [], menuItems = [] }) {
  const [timeFilter, setTimeFilter] = useState('Today');
  
  // --- Multi-Branch States ---
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(localStorage.getItem('tallybrew_branch') || 'All');
  const [activeSales, setActiveSales] = useState(sales);
  const [activeInventory, setActiveInventory] = useState(menuItems);
  const [isLoading, setIsLoading] = useState(false);

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

  // --- UPGRADED, HIGHLY ORGANIZED EXECUTIVE EXPORT ---
  const handleExport = () => {
    const avgOrderValue = ordersServed > 0 ? (totalSales / ordersServed) : 0;
    const totalItemsSold = filteredSales.reduce((sum, s) => sum + Number(s.items_count || 0), 0);
    
    // Exact Payment Metrics (Using our new database columns if they exist)
    let totalCashReceived = 0;
    let totalGCashReceived = 0;

    filteredSales.forEach(s => {
      const amount = Number(s.total_amount || 0);
      const cAmt = Number(s.cash_amount || 0);
      const gAmt = Number(s.gcash_amount || 0);

      // Backwards compatibility for old sales
      if (s.payment_method === 'GCash' && cAmt === 0 && gAmt === 0) {
        totalGCashReceived += amount;
      } else if (s.payment_method === 'Cash' && cAmt === 0 && gAmt === 0) {
        totalCashReceived += amount;
      } else {
        totalCashReceived += cAmt;
        totalGCashReceived += gAmt;
      }
    });

    const cashPct = totalSales > 0 ? ((totalCashReceived / totalSales) * 100).toFixed(1) : 0;
    const gcashPct = totalSales > 0 ? ((totalGCashReceived / totalSales) * 100).toFixed(1) : 0;
    
    // Order Type Metrics
    let dineInCount = 0;
    let takeoutCount = 0;
    let discountedOrders = 0;
    
    // Best Seller Calculations
    const itemCounts = {};

    filteredSales.forEach(s => {
      const summary = s.items_summary || '';
      if (summary.includes('DINE-IN')) dineInCount++;
      if (summary.includes('TAKEOUT') || summary.includes('TAKE-OUT')) takeoutCount++;
      if (summary.includes('(w/')) discountedOrders++;

      if (s.items_summary) {
        let pureItems = s.items_summary.replace(/\[.*?\]\s*/g, '').replace(/\(w\/.*?Discount\)/g, '');
        const splitCustomer = pureItems.split(' - ');
        if(splitCustomer.length > 1) pureItems = splitCustomer.slice(1).join(' - ');

        pureItems.split(', ').forEach(part => {
          const match = part.match(/(\d+)x (.+)/);
          if (match) {
            const qty = parseInt(match[1]);
            const name = match[2].trim();
            itemCounts[name] = (itemCounts[name] || 0) + qty;
          }
        });
      }
    });

    const sortedTopItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);
    const branchName = selectedBranch === 'All' ? 'ALL BRANCHES' : (branches.find(b => b.id === selectedBranch)?.name || 'STORE');

    // Helper function to escape CSV cells
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build the CSV string blocks for beautiful Excel layout
    let csv = '\uFEFF'; 
    
    // 1. Header Block
    csv += "TALLYBREW POS - MASTER EXECUTIVE REPORT,,,,,\n";
    csv += `Generated On:,${escapeCSV(new Date().toLocaleString())},,,,\n`;
    csv += `Location Filter:,${escapeCSV(branchName.toUpperCase())},,,,\n`;
    csv += `Time Filter:,${escapeCSV(timeFilter.toUpperCase())},,,,\n`;
    csv += ",,,,,\n"; // Blank line

    // 2. Executive Summary Block
    csv += "--- EXECUTIVE SUMMARY ---,,,,,\n";
    csv += "Total Gross Revenue,Total Transactions,Avg Order Value,Total Items Sold,Dine-In Orders,Take-Out Orders,Discounted Orders\n";
    csv += `${totalSales.toFixed(2)},${ordersServed},${avgOrderValue.toFixed(2)},${totalItemsSold},${dineInCount},${takeoutCount},${discountedOrders}\n`;
    csv += ",,,,,\n"; 

    // 3. Payment Breakdown Block
    csv += "--- REVENUE BY PAYMENT METHOD ---,,,,,\n";
    csv += "Payment Method,Total Received (PHP),Percentage of Sales,,,\n";
    csv += `Physical Cash,${totalCashReceived.toFixed(2)},${cashPct}%,,,\n`;
    csv += `GCash Transfers,${totalGCashReceived.toFixed(2)},${gcashPct}%,,,\n`;
    csv += ",,,,,\n";

    // 4. Product Performance Block
    csv += "--- PRODUCT PERFORMANCE (ITEMS SOLD) ---,,,,,\n";
    csv += "Rank,Item Name,Quantity Sold,,,\n";
    if (sortedTopItems.length === 0) {
      csv += "-,No items sold in this period.,,,,\n";
    } else {
      sortedTopItems.forEach(([name, qty], index) => {
        csv += `${index + 1},${escapeCSV(name)},${qty},,,\n`;
      });
    }
    csv += ",,,,,\n";

    // 5. Inventory Status Block
    csv += "--- COMPLETE INVENTORY AUDIT ---,,,,,\n";
    csv += "Branch Location,Ingredient / Item Name,Current Stock Level,Unit,Status Warning\n";
    
    const sortedInventory = [...activeInventory].sort((a, b) => {
      const branchA = branches.find(br => br.id === a.branch_id)?.name || '';
      const branchB = branches.find(br => br.id === b.branch_id)?.name || '';
      if (branchA < branchB) return -1;
      if (branchA > branchB) return 1;
      return Number(a.stock_qty || 0) - Number(b.stock_qty || 0);
    });

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

    // 6. Detailed Master Ledger
    csv += "--- MASTER TRANSACTION LEDGER ---,,,,,\n";
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
          customerName = customerSplit[0];
          customerName = customerName.replace(/\s*\(Ref:.*?\)/, ''); 
          pureItems = customerSplit.slice(1).join(' - ');
        }

        const discountMatch = pureItems.match(/\(w\/ (.*?) Discount\)/);
        if (discountMatch) {
          discountType = discountMatch[1];
          pureItems = pureItems.replace(`(w/ ${discountType} Discount)`, '').trim();
        }

        const saleBranchName = branches.find(b => b.id === s.branch_id)?.name || 'Unknown';
        
        // Exact cash split amounts
        const amt = Number(s.total_amount || 0);
        let cAmt = Number(s.cash_amount || 0);
        let gAmt = Number(s.gcash_amount || 0);
        
        if (method === 'Cash' && cAmt === 0 && gAmt === 0) cAmt = amt;
        if (method === 'GCash' && cAmt === 0 && gAmt === 0) gAmt = amt;

        csv += `${escapeCSV(saleBranchName)},${escapeCSV(date)},${escapeCSV(time)},${escapeCSV(s.id)},${escapeCSV(customerName)},${escapeCSV(orderType)},${escapeCSV(displayMethod)},${amt.toFixed(2)},${cAmt.toFixed(2)},${gAmt.toFixed(2)},${escapeCSV(discountType)},${escapeCSV(pureItems)}\n`;
      });
    }

    // Trigger Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const safeDate = new Date().toISOString().split('T')[0];
    const safeBranch = branchName.replace(/\s+/g, '_');
    link.download = `TallyBrew_MasterLedger_${safeBranch}_${timeFilter.replace(/\s+/g, '_')}_${safeDate}.csv`;
    link.click();
  };

  return (
    <div className="dashboard-container" style={{ width: '100%', boxSizing: 'border-box', padding: '40px', position: 'relative' }}>
      
      {isLoading && (
        <div style={{ position: 'absolute', top: '10px', right: '40px', background: '#f59e0b', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>
          Fetching Data...
        </div>
      )}

      <div className="dashboard-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '35px' }}>
        <h1 style={{ margin: 0, fontSize: '25px', fontWeight: '900', color: '#111', letterSpacing: '-0.5px' }}>Store Performance</h1>
        <div className="header-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          
          <select 
            className="filter-btn" 
            value={selectedBranch} 
            onChange={(e) => setSelectedBranch(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '15px', fontWeight: '800', outline: 'none', cursor: 'pointer', backgroundColor: '#fff' }}
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
            style={{ padding: '12px 16px', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '15px', fontWeight: '700', outline: 'none', cursor: 'pointer', backgroundColor: '#fff' }}
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="All Time">All Time</option>
          </select>
          <button className="export-btn" onClick={handleExport} style={{ padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', border: 'none', backgroundColor: '#3B2213', color: '#fff', fontSize: '15px', fontWeight: '800', boxShadow: '0 4px 10px rgba(59, 34, 19, 0.2)', transition: 'transform 0.1s' }} onMouseDown={(e)=>e.target.style.transform='scale(0.95)'} onMouseUp={(e)=>e.target.style.transform='scale(1)'}>
            Export  Report
          </button>
        </div>
      </div>

      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', padding: '24px', borderRadius: '16px', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
          <div className="kpi-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span className="kpi-icon icon-green" style={{ fontSize: '20px', fontWeight: '900', color: '#10b981' }}>₱</span>
            <span className="badge badge-green" style={{ background: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>Live</span>
          </div>
          <div className="kpi-label" style={{ color: '#6b7280', fontSize: '13px', marginBottom: '5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sales ({timeFilter})</div>
          <div className="kpi-value" style={{ fontSize: '28px', fontWeight: '900', color: '#111' }}>₱{totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', padding: '24px', borderRadius: '16px', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
          <div className="kpi-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span className="kpi-icon icon-blue" style={{ fontSize: '20px' }}>🛒</span>
            <span className="badge badge-green" style={{ background: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>Live</span>
          </div>
          <div className="kpi-label" style={{ color: '#6b7280', fontSize: '13px', marginBottom: '5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Orders Served</div>
          <div className="kpi-value" style={{ fontSize: '28px', fontWeight: '900', color: '#111' }}>{ordersServed}</div>
        </div>

        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', padding: '24px', borderRadius: '16px', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
          <div className="kpi-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span className="kpi-icon icon-orange" style={{ fontSize: '20px', color: '#f59e0b', fontWeight: '900' }}>↗</span>
            <span className="badge badge-gray" style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>Live</span>
          </div>
          <div className="kpi-label" style={{ color: '#6b7280', fontSize: '13px', marginBottom: '5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Seller ({timeFilter})</div>
          <div className="kpi-value" style={{ fontSize: '22px', fontWeight: '900', color: '#111', wordBreak: 'break-word', lineHeight: '1.2' }}>{topSeller}</div>
        </div>

        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', padding: '24px', borderRadius: '16px', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
          <div className="kpi-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span className="kpi-icon icon-red" style={{ fontSize: '20px', color: '#ef4444', fontWeight: '900' }}>⚠</span>
            <span className="badge badge-gray" style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>Live</span>
          </div>
          <div className="kpi-label" style={{ color: '#6b7280', fontSize: '13px', marginBottom: '5px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Low Stock Items</div>
          <div className="kpi-value" style={{ fontSize: '28px', fontWeight: '900', color: lowStockCount > 0 ? '#ef4444' : '#111' }}>
            {lowStockCount}
          </div>
        </div>
      </div>

      <div className="chart-section" style={{ width: '100%', overflowX: 'auto', paddingBottom: '15px' }}>
        <h2 className="chart-title" style={{ marginBottom: '25px', fontSize: '22px', fontWeight: '900', color: '#111', textAlign: 'left' }}>Sales Trend (Last 7 Days)</h2>
        
        <div className="trend-chart-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '280px', minWidth: '500px', padding: '30px', border: '2px dashed #e5e7eb', borderRadius: '20px', backgroundColor: '#fff' }}>
          {weeklyChartData.map((d, i) => (
            <div key={i} className="trend-bar-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <span className="trend-tooltip" style={{ fontSize: '13px', marginBottom: '8px', color: '#6b7280', fontWeight: '700' }}>₱{d.total.toFixed(0)}</span>
              
              <div 
                className="trend-bar" 
                style={{ 
                  height: `${(d.total / maxChartValue) * 100}%`, 
                  minHeight: d.total > 0 ? '6px' : '3px',
                  width: '45px', 
                  backgroundColor: '#B56124',
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.3s ease'
                }}
              ></div>
              <span className="trend-label" style={{ marginTop: '12px', fontSize: '13px', fontWeight: '800', color: '#9ca3af' }}>{d.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}