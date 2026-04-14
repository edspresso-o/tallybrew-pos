import React, { useState, useMemo } from 'react';

export default function Transactions({ sales = [], onVoidSale, activeCashier, branchId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('All');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; 

  // SAFE ARRAY CHECK
  const safeSales = Array.isArray(sales) ? sales : [];

  // Advanced Filtering & Sorting Logic
  const filteredSales = useMemo(() => {
    return [...safeSales].reverse().filter(sale => {
      const safeId = String(sale.id || '').toLowerCase();
      const safeSummary = String(sale.items_summary || '').toLowerCase();
      const safeSearchTerm = String(searchTerm || '').toLowerCase();

      const searchMatch = 
        safeId.includes(safeSearchTerm) || 
        safeSummary.includes(safeSearchTerm);
      
      const methodStr = sale.payment_method ? String(sale.payment_method).toUpperCase() : 'CASH';
      const methodMatch = filterMethod === 'All' || methodStr.includes(String(filterMethod).toUpperCase());
      
      return searchMatch && methodMatch;
    });
  }, [safeSales, searchTerm, filterMethod]);

  // Slice the array to only show the current page's items
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSales, currentPage]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  // Reset page if search changes the total pages available
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  // Live Metrics Calculations 
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (Number(sale.total_amount) || 0), 0);
  const avgOrderValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  const getBadgeStyle = (method) => {
    const isGCash = String(method || '').toLowerCase().includes('gcash');
    return {
      backgroundColor: isGCash ? '#eff6ff' : '#f0fdf4',
      color: isGCash ? '#2563eb' : '#16a34a',
      border: isGCash ? '1px solid #bfdbfe' : '1px solid #bbf7d0',
      padding: '4px 10px',
      borderRadius: '8px',
      fontSize: '11px',
      fontWeight: '900',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    };
  };

  return (
    <div className="transactions-page">
      
      {/* THE FIX: Highly Optimized Responsive CSS */}
      <style>{`
        @keyframes popIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        
        .transactions-page {
          padding: clamp(15px, 4vw, 30px);
          width: 100%;
          box-sizing: border-box;
          overflow-y: auto;
          height: 100%;
          background-color: #f9fafb; /* Slight off-white background to make cards pop */
        }

        /* --- DESKTOP FIRST STYLES --- */
        .page-header {
          margin-bottom: 25px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 15px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 30px;
        }

        .filter-ribbon {
          display: flex;
          gap: 12px;
          margin-bottom: 25px;
        }

        .tx-card {
          animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px 24px;
          gap: 24px;
          box-shadow: 0 4px 12px rgba(59, 34, 19, 0.03);
          transition: all 0.2s ease;
          width: 100%;
          box-sizing: border-box;
        }
        
        .tx-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 25px rgba(59, 34, 19, 0.08);
          border-color: #E6D0A9;
        }

        .tx-left { flex: 1; min-width: 0; }
        
        .tx-right {
          display: flex;
          align-items: center;
          gap: 25px;
          padding-left: 25px;
          border-left: 2px dashed #e5e7eb;
          flex-shrink: 0;
        }

        .tx-items {
          background-color: #FDFBF7;
          border: 1px solid #E6D0A9;
          padding: 12px 16px;
          border-radius: 10px;
          margin-top: 12px;
          color: #4b5563;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .premium-input:focus { outline: none; border-color: #B56124 !important; box-shadow: 0 0 0 4px rgba(181, 97, 36, 0.1) !important; }

        .pagination-btn {
          padding: 8px 16px;
          border-radius: 10px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid #e5e7eb;
          background: #fff;
          color: #3B2213;
        }
        .pagination-btn:hover:not(:disabled) { border-color: #B56124; color: #B56124; }
        .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; background: #f3f4f6; }

        /* --- MOBILE RESPONSIVE FIXES --- */
        @media (max-width: 768px) {
          .page-header {
            margin-top: 45px; /* Pushes the header below the hamburger menu! */
            flex-direction: column;
            align-items: flex-start;
          }
          
          .kpi-grid { 
            grid-template-columns: 1fr; /* Stack KPI cards vertically */
            gap: 12px;
          }
          
          .filter-ribbon { 
            flex-direction: column; /* Stack search bar and dropdown */
          }
          
          .filter-ribbon select {
            width: 100%; /* Make dropdown full width for easy tapping */
          }

          .tx-card { 
            flex-direction: column; 
            align-items: stretch; /* Make items stretch full width */
            padding: 16px; 
            gap: 16px; 
          }
          
          .tx-right { 
            padding-left: 0; 
            border-left: none; 
            border-top: 2px dashed #e5e7eb; /* Move divider to the top */
            padding-top: 16px; 
            width: 100%; 
            justify-content: space-between; /* Put Total on left, Void on right */
            gap: 10px;
          }

          .tx-details-row {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          
          .tx-date {
            margin-left: 0 !important;
          }
        }
      `}</style>

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '900', color: '#111', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>Transactions</h2>
          <p style={{ color: '#B56124', fontSize: '14px', fontWeight: '700', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Financial Overview & History</p>
        </div>
      </div>

      {/* LIVE KPI DASHBOARD */}
      <div className="kpi-grid">
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #f3f4f6', borderBottom: '4px solid #10b981', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <p style={{ color: '#6b7280', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 5px 0' }}>Total Revenue</p>
          <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#111' }}>₱{totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #f3f4f6', borderBottom: '4px solid #3B2213', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <p style={{ color: '#6b7280', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 5px 0' }}>Total Orders</p>
          <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#111' }}>{filteredSales.length}</h3>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #f3f4f6', borderBottom: '4px solid #B56124', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <p style={{ color: '#6b7280', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 5px 0' }}>Avg Order Value</p>
          <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#111' }}>₱{avgOrderValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
        </div>
      </div>

      {/* SEARCH & FILTER RIBBON */}
      <div className="filter-ribbon">
        <div style={{ flex: 1, position: 'relative' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="Search by Order ID or Item..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); 
            }}
            className="premium-input"
            style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '2px solid #e5e7eb', backgroundColor: '#fff', fontSize: '14px', fontWeight: '600', color: '#111', boxSizing: 'border-box', transition: 'all 0.2s' }}
          />
        </div>
        <select 
          value={filterMethod}
          onChange={(e) => {
            setFilterMethod(e.target.value);
            setCurrentPage(1); 
          }}
          className="premium-input"
          style={{ padding: '12px 16px', borderRadius: '12px', border: '2px solid #e5e7eb', backgroundColor: '#fff', fontSize: '14px', fontWeight: '800', color: '#3B2213', cursor: 'pointer', outline: 'none', transition: 'all 0.2s', minWidth: '140px' }}
        >
          <option value="All">All Methods</option>
          <option value="Cash">Cash Only</option>
          <option value="GCash">GCash Only</option>
        </select>
      </div>

      {/* TRANSACTIONS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
        {paginatedSales.length === 0 ? (
          /* EMPTY STATE */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '20px', border: '2px dashed #E6D0A9', marginTop: '10px', animation: 'popIn 0.3s' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#FDFBF7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '2px solid #E6D0A9' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#3B2213', margin: '0 0 8px 0' }}>No Records Found</h3>
            <p style={{ color: '#9ca3af', fontWeight: '600', margin: 0, textAlign: 'center', fontSize: '14px' }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          paginatedSales.map((sale, index) => (
            
            <div key={sale.id} className="tx-card" style={{ animationDelay: `${index * 0.03}s` }}>
              
              {/* LEFT SIDE: Order Details */}
              <div className="tx-left"> 
                <div className="tx-details-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#111', fontSize: '16px', fontWeight: '900', letterSpacing: '0.5px' }}>
                    #{sale.id?.toString().slice(0, 6).toUpperCase() || 'SYS-01'}
                  </span>
                  
                  <span style={getBadgeStyle(sale.payment_method)}>
                    {sale.payment_method?.toLowerCase().includes('gcash') ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle></svg>
                    )}
                    {sale.payment_method || 'CASH'}
                  </span>
                  
                  <span className="tx-date" style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '700', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    {new Date(sale.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                {/* Items block */}
                <div className="tx-items">
                  {sale.items_summary}
                </div>
              </div>

              {/* RIGHT SIDE: Total & Action */}
              <div className="tx-right">
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: '90px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Total Paid</span>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#3B2213', letterSpacing: '-0.5px' }}>
                    ₱{Number(sale.total_amount).toFixed(2)}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (typeof onVoidSale === 'function') {
                      onVoidSale(sale); 
                    } else {
                      alert("Error: The main app is missing the void function!");
                    }
                  }}
                  style={{ 
                    backgroundColor: '#fff', color: '#ef4444', border: '2px solid #fecaca', 
                    padding: '10px 16px', borderRadius: '10px', fontWeight: '800', fontSize: '13px', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', 
                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.borderColor = '#ef4444'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#fecaca'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                  Void
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', paddingBottom: '40px' }}>
          <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            ← Previous
          </button>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#6b7280' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next →
          </button>
        </div>
      )}

    </div>
  );
}