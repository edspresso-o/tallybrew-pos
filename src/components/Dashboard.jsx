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

  // --- NEW: DYNAMIC CHART LOGIC ---
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    if (timeFilter === 'Today') {
      // Group by hours of the day
      const hourBins = [
        { label: '6 AM', min: 0, max: 9 },
        { label: '9 AM', min: 9, max: 12 },
        { label: '12 PM', min: 12, max: 15 },
        { label: '3 PM', min: 15, max: 18 },
        { label: '6 PM', min: 18, max: 21 },
        { label: '9 PM', min: 21, max: 24 }
      ];
      hourBins.forEach(bin => {
        const binSales = activeSales.filter(s => {
          const d = new Date(s.created_at);
          return d.toDateString() === today.toDateString() && d.getHours() >= bin.min && d.getHours() < bin.max;
        });
        const total = binSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
        data.push({ label: bin.label, total });
      });
    } 
    else if (timeFilter === 'This Month') {
      // Group by rolling 4 weeks
      for (let i = 3; i >= 0; i--) {
        const startDate = new Date();
        startDate.setDate(today.getDate() - ((i + 1) * 7));
        const endDate = new Date();
        endDate.setDate(today.getDate() - (i * 7));
        
        const binSales = activeSales.filter(s => {
          const d = new Date(s.created_at);
          return d > startDate && d <= endDate;
        });
        const total = binSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
        data.push({ label: `WK ${4 - i}`, total });
      }
    } 
    else if (timeFilter === 'All Time') {
      // Group by Last 6 Months
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setMonth(today.getMonth() - i);
        const targetMonth = targetDate.getMonth();
        const targetYear = targetDate.getFullYear();
        const monthStr = targetDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        
        const binSales = activeSales.filter(s => {
          const d = new Date(s.created_at);
          return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
        });
        const total = binSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
        data.push({ label: monthStr, total });
      }
    } 
    else {
      // Default: 'This Week' (Last 7 Days)
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setDate(today.getDate() - i);
        const dateString = targetDate.toDateString();
        
        const daySales = activeSales.filter(s => new Date(s.created_at).toDateString() === dateString);
        const dailyTotal = daySales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
        
        data.push({
          label: targetDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
          total: dailyTotal
        });
      }
    }
    return data;
  }, [activeSales, timeFilter]);

  const maxChartValue = Math.max(...chartData.map(d => d.total), 1);

  // --- BRANDED PDF EXPORT LOGIC ---
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

      // Global Stats
      const avgOrderValue = ordersServed > 0 ? (totalSales / ordersServed) : 0;
      const totalItemsSold = filteredSales.reduce((sum, s) => sum + Number(s.items_count || 0), 0);
      
      let totalCashReceived = 0;
      let totalGCashReceived = 0;
      
      filteredSales.forEach(s => {
        const amount = Number(s.total_amount || 0);
        const cAmt = Number(s.cash_amount || 0);
        const gAmt = Number(s.gcash_amount || 0);
        if (s.payment_method === 'GCash' && cAmt === 0 && gAmt === 0) totalGCashReceived += amount;
        else if (s.payment_method === 'Cash' && cAmt === 0 && gAmt === 0) totalCashReceived += amount;
        else { totalCashReceived += cAmt; totalGCashReceived += gAmt; }
      });

      const branchNameLabel = selectedBranch === 'All' ? 'ALL BRANCHES' : (branches.find(b => b.id === selectedBranch)?.name || 'STORE');
      const targetBranches = selectedBranch === 'All' ? branches : branches.filter(b => b.id === selectedBranch);

      // BUILD HTML FOR PDF
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>TallyBrew Report - ${branchNameLabel}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              color: #3B2213; 
              background: #fff; 
              margin: 0; 
              padding: 40px; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important;
            }
            .header { text-align: center; border-bottom: 4px solid #B56124; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { max-width: 180px; margin-bottom: 10px; }
            h1 { font-size: 28px; font-weight: 900; margin: 0 0 5px 0; color: #3B2213; letter-spacing: -1px; }
            .meta-info { font-size: 14px; font-weight: 600; color: #6b7280; margin: 0; }
            .meta-info span { color: #B56124; font-weight: 800; }
            
            .global-summary { display: flex; gap: 15px; margin-bottom: 30px; }
            .summary-card { flex: 1; background: #FDFBF7; border: 2px solid #E6D0A9; border-radius: 12px; padding: 15px; text-align: center; }
            .summary-label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #B56124; margin-bottom: 5px; }
            .summary-value { font-size: 22px; font-weight: 900; color: #3B2213; }
            
            .branch-section { page-break-before: always; padding-top: 20px; }
            .branch-header { background: #3B2213; color: #FDFBF7; padding: 15px 20px; border-radius: 12px; font-size: 18px; font-weight: 900; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
            
            h3 { font-size: 14px; font-weight: 900; color: #B56124; text-transform: uppercase; margin: 25px 0 10px 0; border-bottom: 2px dashed #E6D0A9; padding-bottom: 5px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; page-break-inside: avoid; }
            th { background-color: #FDFBF7; color: #B56124; font-weight: 800; padding: 10px; text-align: left; border-bottom: 2px solid #E6D0A9; }
            td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; color: #3B2213; font-weight: 600; }
            tr:nth-child(even) td { background-color: #fafafa; }
            
            .badge { padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; }
            .badge-danger { background: #fee2e2; color: #dc2626; }
            .badge-warn { background: #fef3c7; color: #d97706; }
            .badge-safe { background: #d1fae5; color: #059669; }

            .footer { text-align: center; margin-top: 50px; font-size: 10px; color: #9ca3af; font-weight: 600; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${window.location.origin}${import.meta.env.BASE_URL}images/TallyBrewPosLogo.png" alt="TallyBrew Logo" class="logo" onerror="this.style.display='none'" />
            <h1>MASTER DATA REPORT</h1>
            <p class="meta-info">Generated: <span>${new Date().toLocaleString()}</span> &nbsp;|&nbsp; Filter: <span>${timeFilter.toUpperCase()}</span> &nbsp;|&nbsp; Location: <span>${branchNameLabel.toUpperCase()}</span></p>
          </div>
      `;

      if (selectedBranch === 'All') {
        html += `
          <div class="global-summary">
            <div class="summary-card"><div class="summary-label">Total Revenue</div><div class="summary-value">₱${totalSales.toLocaleString(undefined, {minimumFractionDigits:2})}</div></div>
            <div class="summary-card"><div class="summary-label">Transactions</div><div class="summary-value">${ordersServed}</div></div>
            <div class="summary-card"><div class="summary-label">Avg Order Value</div><div class="summary-value">₱${avgOrderValue.toFixed(2)}</div></div>
            <div class="summary-card"><div class="summary-label">Items Sold</div><div class="summary-value">${totalItemsSold}</div></div>
          </div>
          <div class="global-summary">
            <div class="summary-card"><div class="summary-label">Total Physical Cash</div><div class="summary-value">₱${totalCashReceived.toLocaleString(undefined, {minimumFractionDigits:2})}</div></div>
            <div class="summary-card"><div class="summary-label">Total GCash</div><div class="summary-value">₱${totalGCashReceived.toLocaleString(undefined, {minimumFractionDigits:2})}</div></div>
          </div>
        `;
      }

      targetBranches.forEach((branch, index) => {
        const bId = branch.id;
        const bName = branch.name;

        const bSales = filteredSales.filter(s => s.branch_id === bId);
        const bShifts = filteredShifts.filter(s => s.branch_id === bId);
        const bInventory = activeInventory.filter(i => i.branch_id === bId);

        if (bSales.length === 0 && bShifts.length === 0 && bInventory.length === 0) return;

        let bTotalSales = 0, bItemsSold = 0, bDineIn = 0, bTakeout = 0, bDiscounted = 0;
        let bCash = 0, bGCash = 0;
        let bItemCounts = {};
        let bUniqueCustomers = new Set();

        bSales.forEach(s => {
          const amount = Number(s.total_amount || 0);
          bTotalSales += amount;
          bItemsSold += Number(s.items_count || 0);

          const cAmt = Number(s.cash_amount || 0);
          const gAmt = Number(s.gcash_amount || 0);
          if (s.payment_method === 'GCash' && cAmt === 0 && gAmt === 0) bGCash += amount;
          else if (s.payment_method === 'Cash' && cAmt === 0 && gAmt === 0) bCash += amount;
          else { bCash += cAmt; bGCash += gAmt; }

          const summary = s.items_summary || '';
          if (summary.includes('DINE-IN')) bDineIn++;
          if (summary.includes('TAKEOUT') || summary.includes('TAKE-OUT')) bTakeout++;
          if (summary.includes('(w/')) bDiscounted++;

          let pureItems = summary;
          let orderTypeMatch = pureItems.match(/\[(.*?)\]/);
          if (orderTypeMatch) pureItems = pureItems.replace(`[${orderTypeMatch[1]}] `, '');

          let customerName = "Guest";
          const customerSplit = pureItems.split(' - ');
          if (customerSplit.length > 1) {
            customerName = customerSplit[0].replace(/\s*\(Ref:.*?\)/, '').trim();
            pureItems = customerSplit.slice(1).join(' - ');
          }
          if (customerName !== 'Guest') bUniqueCustomers.add(customerName);

          pureItems = pureItems.replace(/\(w\/.*?Discount\)/g, '');
          pureItems.split(', ').forEach(part => {
            const match = part.match(/(\d+)x (.+)/);
            if (match) {
              const qty = parseInt(match[1]);
              const name = match[2].trim();
              bItemCounts[name] = (bItemCounts[name] || 0) + qty;
            }
          });
        });

        if (selectedBranch === 'All' || index > 0) {
          html += `<div class="branch-section">`;
        } else {
          html += `<div>`;
        }

        html += `<div class="branch-header">📍 ${bName.toUpperCase()} REPORT</div>`;

        // 1. Metrics
        html += `
          <h3>Sales & Metrics</h3>
          <table>
            <tr><th>Revenue</th><th>Transactions</th><th>Cash Total</th><th>GCash Total</th><th>Items Sold</th><th>Dine-In</th><th>Take-Out</th><th>Discounted</th></tr>
            <tr>
              <td>₱${bTotalSales.toFixed(2)}</td><td>${bSales.length}</td><td>₱${bCash.toFixed(2)}</td><td>₱${bGCash.toFixed(2)}</td>
              <td>${bItemsSold}</td><td>${bDineIn}</td><td>${bTakeout}</td><td>${bDiscounted}</td>
            </tr>
          </table>
        `;

        // 2. Shifts
        html += `<h3>Shift & Register Logs</h3><table><tr><th>Cashier</th><th>Clock In</th><th>Clock Out</th><th>Start Float</th><th>Expected</th><th>Actual</th><th>Discrepancy</th></tr>`;
        if (bShifts.length === 0) {
          html += `<tr><td colspan="7" style="text-align:center; color:#9ca3af;">No shift records found.</td></tr>`;
        } else {
          bShifts.forEach(shift => {
            const clockIn = new Date(shift.start_time).toLocaleString();
            const clockOut = shift.end_time ? new Date(shift.end_time).toLocaleString() : 'STILL ACTIVE';
            const exp = Number(shift.expected_cash || 0);
            const act = Number(shift.actual_cash || 0);
            const short = Number(shift.shortage || 0);
            
            let discrepancy = '<span class="badge badge-safe">Perfect</span>';
            if (short < 0) discrepancy = `<span class="badge badge-danger">SHORT: ₱${Math.abs(short).toFixed(2)}</span>`;
            if (short > 0) discrepancy = `<span class="badge badge-warn">OVER: ₱${short.toFixed(2)}</span>`;

            html += `<tr><td>${shift.cashier_name}</td><td>${clockIn}</td><td>${clockOut}</td><td>₱${Number(shift.starting_cash || 0).toFixed(2)}</td><td>₱${exp.toFixed(2)}</td><td>₱${act.toFixed(2)}</td><td>${discrepancy}</td></tr>`;
          });
        }
        html += `</table>`;

        // 3. Products
        html += `<h3>Product Performance</h3><table><tr><th>Rank</th><th>Item Name</th><th>Quantity Sold</th></tr>`;
        const sortedItems = Object.entries(bItemCounts).sort((a, b) => b[1] - a[1]);
        if (sortedItems.length === 0) {
           html += `<tr><td colspan="3" style="text-align:center; color:#9ca3af;">No items sold.</td></tr>`;
        } else {
          sortedItems.forEach(([name, qty], idx) => {
            html += `<tr><td>#${idx + 1}</td><td>${name}</td><td>${qty}</td></tr>`;
          });
        }
        html += `</table>`;

        // 4. Inventory
        html += `<h3>Inventory Audit</h3><table><tr><th>Ingredient / Item Name</th><th>Current Stock Level</th><th>Status Warning</th></tr>`;
        const sortedInv = [...bInventory].sort((a, b) => Number(a.stock_qty || 0) - Number(b.stock_qty || 0));
        if (sortedInv.length === 0) {
          html += `<tr><td colspan="3" style="text-align:center; color:#9ca3af;">No inventory data available.</td></tr>`;
        } else {
          sortedInv.forEach(item => {
            const stock = Number(item.stock_qty || 0);
            let status = '<span class="badge badge-safe">Healthy</span>';
            if (stock <= 0) status = '<span class="badge badge-danger">OUT OF STOCK</span>';
            else if (stock <= 10) status = '<span class="badge badge-danger">CRITICAL - RESTOCK NOW</span>';
            else if (stock <= 30) status = '<span class="badge badge-warn">Low Stock</span>';
            
            html += `<tr><td>${item.name}</td><td>${stock} ${item.unit}</td><td>${status}</td></tr>`;
          });
        }
        html += `</table>`;

        // 5. Ledger
        html += `<h3>Master Transaction Ledger</h3><table><tr><th>Date/Time</th><th>Customer</th><th>Type</th><th>Method</th><th>Total</th><th>Items</th></tr>`;
        if (bSales.length === 0) {
          html += `<tr><td colspan="6" style="text-align:center; color:#9ca3af;">No transactions found.</td></tr>`;
        } else {
          const sortedBSales = [...bSales].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          sortedBSales.forEach(s => {
            const dateObj = new Date(s.created_at);
            const dateTime = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            
            let method = s.payment_method || 'Cash';
            let orderType = "Unknown";
            let customerName = "Guest";
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

            html += `<tr><td>${dateTime}</td><td>${customerName}</td><td>${orderType}</td><td>${method}</td><td>₱${Number(s.total_amount || 0).toFixed(2)}</td><td><span style="font-size: 10px; color: #6b7280;">${pureItems}</span></td></tr>`;
          });
        }
        html += `</table></div>`; 
      });

      html += `
          <div class="footer">
            TallyBrew POS System Report.<br>
            © ${new Date().getFullYear()} TallyBrew
          </div>
        </body></html>
      `;

      const printWindow = window.open('', '_blank', 'width=900,height=800');
      printWindow.document.write(html);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        setIsExporting(false);
      }, 500);

    } catch (err) {
      alert("Error generating PDF Report: " + err.message);
      setIsExporting(false);
    }
  };

  return (
    
    <div className="dashboard-container" style={{ width: '100%', boxSizing: 'border-box', padding: 'clamp(15px, 4vw, 40px)', position: 'relative' }}>
      
      {(isLoading || isExporting) && (
        <div style={{ position: 'absolute', top: '10px', right: 'clamp(15px, 4vw, 40px)', background: '#B56124', color: '#fff', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', animation: 'pulse 1.5s infinite', zIndex: 100, boxShadow: '0 4px 10px rgba(181, 97, 36, 0.3)' }}>
          {isExporting ? 'Generating PDF...' : 'Fetching Data...'}
        </div>
      )}

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
          
          <button className="export-btn no-print" onClick={handleExport} disabled={isExporting} style={{ flex: '1 1 auto', padding: '10px 16px', borderRadius: '10px', cursor: isExporting ? 'not-allowed' : 'pointer', border: 'none', backgroundColor: '#3B2213', color: '#fff', fontSize: '14px', fontWeight: '800', boxShadow: '0 4px 10px rgba(59, 34, 19, 0.2)', transition: 'transform 0.1s', opacity: isExporting ? 0.7 : 1, whiteSpace: 'nowrap' }} onMouseDown={(e)=> !isExporting && (e.target.style.transform='scale(0.95)')} onMouseUp={(e)=>!isExporting && (e.target.style.transform='scale(1)')}>
            {isExporting ? 'Generating PDF...' : 'Export PDF Report'}
          </button>
        </div>
      </div>

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

      <div className="chart-section" style={{ width: '100%', paddingBottom: '15px' }}>
        <h2 className="chart-title" style={{ marginBottom: '20px', fontSize: 'clamp(18px, 3vw, 22px)', fontWeight: '900', color: '#111', textAlign: 'left' }}>Sales Trend ({timeFilter})</h2>
        
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '20px' }}>
          <div className="trend-chart-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '250px', minWidth: '450px', padding: '20px', border: '2px dashed #e5e7eb', borderRadius: '20px', backgroundColor: '#fff' }}>
            {chartData.map((d, i) => (
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
                <span className="trend-label" style={{ marginTop: '10px', fontSize: '12px', fontWeight: '800', color: '#9ca3af' }}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}