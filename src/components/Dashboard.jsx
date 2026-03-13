import React, { useState, useMemo } from 'react';

export default function Dashboard({ sales = [], menuItems = [] }) {
  const [timeFilter, setTimeFilter] = useState('Today');

  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter(sale => {
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
  }, [sales, timeFilter]);

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

  const lowStockCount = menuItems.filter(item => (item.stock_qty || 0) <= 10).length;

  const weeklyChartData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() - i);
      const dateString = targetDate.toDateString();
      
      const daySales = sales.filter(s => new Date(s.created_at).toDateString() === dateString);
      const dailyTotal = daySales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
      
      data.push({
        day: targetDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        total: dailyTotal
      });
    }
    return data;
  }, [sales]);

  const maxChartValue = Math.max(...weeklyChartData.map(d => d.total), 1);

  const handleExport = () => {
    const avgOrderValue = ordersServed > 0 ? (totalSales / ordersServed) : 0;
    const totalItemsSold = filteredSales.reduce((sum, s) => sum + Number(s.items_count || 0), 0);
    
    const cashSales = filteredSales.filter(s => s.payment_method === 'Cash' || !s.payment_method).reduce((sum, s) => sum + Number(s.total_amount), 0);
    const gcashSales = filteredSales.filter(s => s.payment_method === 'GCash').reduce((sum, s) => sum + Number(s.total_amount), 0);
    
    const cashPct = totalSales > 0 ? ((cashSales / totalSales) * 100).toFixed(1) : 0;
    const gcashPct = totalSales > 0 ? ((gcashSales / totalSales) * 100).toFixed(1) : 0;

    let csvContent = '\uFEFF'; 
    csvContent += `======================================================================\n`;
    csvContent += `TALLYBREW POS - COMPREHENSIVE BUSINESS ANALYTICS REPORT\n`;
    csvContent += `======================================================================\n`;
    csvContent += `Report Period:,${timeFilter.toUpperCase()}\n`;
    csvContent += `Generated On:,${new Date().toLocaleString()}\n`;
    csvContent += `Total Transactions:,${ordersServed}\n\n`;

    csvContent += `--- 1. KEY PERFORMANCE INDICATORS ---\n`;
    csvContent += `Metric,Value\n`;
    csvContent += `Total Sales Revenue,PHP ${totalSales.toFixed(2)}\n`;
    csvContent += `Average Order Value,PHP ${avgOrderValue.toFixed(2)}\n`;
    csvContent += `Total Items Sold,${totalItemsSold} Items\n`;
    csvContent += `Top Selling Item,"${topSeller}"\n\n`;

    csvContent += `--- 2. PAYMENT METHODS BREAKDOWN ---\n`;
    csvContent += `Method,Total Revenue,Percentage\n`;
    csvContent += `Cash,PHP ${cashSales.toFixed(2)},${cashPct}%\n`;
    csvContent += `GCash,PHP ${gcashSales.toFixed(2)},${gcashPct}%\n\n`;

    csvContent += `--- 3. INVENTORY HEALTH AUDIT ---\n`;
    csvContent += `Item Name,Current Stock,Unit,Status\n`;
    
    const sortedInventory = [...menuItems].sort((a, b) => Number(a.stock_qty || 0) - Number(b.stock_qty || 0));
    sortedInventory.forEach(item => {
      const stock = Number(item.stock_qty || 0);
      let status = 'Healthy';
      if (stock <= 0) status = '❌ OUT OF STOCK';
      else if (stock <= 10) status = '⚠ CRITICAL - RESTOCK NOW';
      else if (stock <= 30) status = 'Low Stock';
      csvContent += `"${item.name || 'Unknown'}",${stock},"${item.unit || ''}","${status}"\n`;
    });
    csvContent += `\n`;

    csvContent += `--- 4. DETAILED TRANSACTION LOG ---\n`;
    if (filteredSales.length === 0) {
      csvContent += `No transactions found for this period.\n`;
    } else {
      csvContent += `Date,Time,Order ID,Payment Method,Amount (PHP),Order Details\n`;
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

        const summary = s.items_summary ? s.items_summary.replace(/"/g, '""') : 'No details';

        const row = [`"${date}"`, `"${time}"`, `"${s.id}"`, `"${displayMethod}"`, Number(s.total_amount || 0).toFixed(2), `"${summary}"`];
        csvContent += row.join(",") + "\n";
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const safeDate = new Date().toISOString().split('T')[0];
    link.download = `TallyBrew_Analytics_${timeFilter.replace(/\s+/g, '_')}_${safeDate}.csv`;
    link.click();
  };

  return (
    <div className="dashboard-container" style={{ width: '100%', boxSizing: 'border-box', padding: '40px' }}>
      
      <div className="dashboard-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '35px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: '#111', letterSpacing: '-0.5px' }}>Store Performance</h1>
        <div className="header-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
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
          <button className="export-btn" onClick={handleExport} style={{ padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', border: 'none', backgroundColor: '#B56124', color: '#fff', fontSize: '15px', fontWeight: '800', boxShadow: '0 4px 10px rgba(181, 97, 36, 0.2)' }}>
            Export Report
          </button>
        </div>
      </div>

      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* ADDED textAlign: 'left' TO FORCE THE ALIGNMENT */}
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