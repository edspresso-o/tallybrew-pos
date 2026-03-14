import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function KitchenDisplay() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchName, setBranchName] = useState('');
  const [errorMessage, setErrorMessage] = useState(null); // Prevents the white screen!

  // Fetch the specific text name of the branch for the header
  useEffect(() => {
    const fetchBranchName = async () => {
      try {
        const activeBranchId = localStorage.getItem('tallybrew_branch');
        if (activeBranchId && activeBranchId !== 'admin_remote') {
          const { data } = await supabase.from('branches').select('name').eq('id', activeBranchId).single();
          if (data) setBranchName(data.name);
        } else if (activeBranchId === 'admin_remote') {
          setBranchName('Global View (Admin)');
        }
      } catch (err) {
        console.error("Branch fetch error", err);
      }
    };
    fetchBranchName();
  }, []);

  // Fetch pending orders safely
  const fetchOrders = async () => {
    try {
      const activeBranchId = localStorage.getItem('tallybrew_branch');

      // We only select 'sales' to prevent relational database crashes
      let query = supabase
        .from('sales')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true }); 

      // Apply the branch filter
      if (activeBranchId && activeBranchId !== 'admin_remote') {
        query = query.eq('branch_id', activeBranchId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setActiveOrders(data || []);
      setErrorMessage(null); // Clear errors if successful
    } catch (error) {
      console.error("Error fetching kitchen orders:", error);
      setErrorMessage("Could not load orders from the database.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const markAsComplete = async (saleId) => {
    try {
      setActiveOrders(prev => prev.filter(order => order.id !== saleId));

      const { error } = await supabase
        .from('sales')
        .update({ status: 'completed' })
        .eq('id', saleId);

      if (error) throw error;
    } catch (error) {
      console.error("Error completing order:", error);
      fetchOrders(); 
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "Time Unknown";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Safe ID display
  const displayId = (id) => {
    if (!id) return "N/A";
    return String(id).slice(0, 8);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontWeight: '900', color: '#B56124', fontSize: '20px' }}>Loading Kitchen Display...</div>;

  return (
    <div style={{ padding: '20px', flex: 1, width: '100%', boxSizing: 'border-box', backgroundColor: '#e5e7eb', minHeight: '100vh', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#111', letterSpacing: '-1px' }}>
          Kitchen Display {branchName && <span style={{ color: '#B56124', fontSize: '24px' }}>— {branchName}</span>}
        </h1>
        <div style={{ background: '#b85e2b', color: 'white', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold' }}>
          {activeOrders.length} Pending Orders
        </div>
      </div>

      {/* NEW: Error Boundary display so it never white-screens again */}
      {errorMessage && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '20px', borderRadius: '16px', marginBottom: '20px', fontWeight: 'bold', border: '2px solid #fecaca' }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {activeOrders.length === 0 && !errorMessage ? (
        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '16px', color: '#9ca3af', fontWeight: 'bold', fontSize: '20px' }}>
          No pending orders.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          
          {activeOrders.map(order => (
            <div key={order.id} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column' }}>
              
              <div style={{ backgroundColor: '#fdfbf7', borderBottom: '2px dashed #e5e7eb', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Order #{displayId(order.id)}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#3b2213' }}>
                    {formatTime(order.created_at)}
                  </div>
                </div>
                {order.items_summary && order.items_summary.includes('[DINE-IN]') ? (
                   <span style={{ backgroundColor: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '900' }}>DINE-IN</span>
                ) : (
                   <span style={{ backgroundColor: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '900' }}>TAKE-OUT</span>
                )}
              </div>

              <div style={{ padding: '15px', flex: 1 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {/* Safely split the receipt text to show items */}
                  {order.items_summary ? (
                    order.items_summary.split(' - ').length > 1 ? (
                      order.items_summary.split(' - ')[1].split(', ').map((itemText, idx) => (
                        <li key={idx} style={{ marginBottom: '12px', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px', fontSize: '16px', fontWeight: '800', color: '#111' }}>
                          {itemText}
                        </li>
                      ))
                    ) : (
                      <li style={{ color: '#111', fontWeight: 'bold' }}>{order.items_summary}</li>
                    )
                  ) : (
                    <li style={{ color: '#9ca3af', fontStyle: 'italic' }}>No items listed.</li>
                  )}
                </ul>
              </div>

              <button 
                onClick={() => markAsComplete(order.id)}
                style={{ width: '100%', padding: '20px', backgroundColor: '#3b2213', color: 'white', border: 'none', fontSize: '16px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', transition: 'background-color 0.2s' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#111'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3b2213'}
              >
                Mark Complete
              </button>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}