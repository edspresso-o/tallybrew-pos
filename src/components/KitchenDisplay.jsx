import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [now, setNow] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const activeBranch = localStorage.getItem('tallybrew_branch');

  const fetchOrders = async () => {
    let query = supabase
      .from('sales')
      .select('id, created_at, items_summary, kitchen_status')
      .neq('kitchen_status', 'completed')
      .order('created_at', { ascending: true });
      
    if (activeBranch && activeBranch !== 'admin_remote') {
      query = query.eq('branch_id', activeBranch);
    }

    const { data, error } = await query;
    if (data) {
      setOrders(data);
    }
    setIsLoading(false);
  };

  // Poll for new orders every 5 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update the live timers every 1 second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const markCompleted = async (id) => {
    // Instantly remove from screen for a snappy feel
    setOrders(prev => prev.filter(o => o.id !== id));
    
    // Update the database in the background
    await supabase.from('sales').update({ kitchen_status: 'completed' }).eq('id', id);
  };

  const getElapsedSeconds = (createdAt) => {
    const diff = Math.floor((now - new Date(createdAt)) / 1000);
    return diff > 0 ? diff : 0;
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDFBF7' }}>
        <h2 style={{ color: '#B56124', fontFamily: "'Inter', sans-serif" }}>Loading Kitchen Display...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#FDFBF7', minHeight: '100%', width: '100%', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}>
      
      <style>{`
        @keyframes pulseUrgent {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .order-card { transition: all 0.3s ease; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', textAlign: 'left' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#3B2213', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>
            Kitchen Display
          </h1>
          <p style={{ color: '#6b7280', fontSize: '15px', margin: 0, fontWeight: '500' }}>
            {orders.length} active {orders.length === 1 ? 'order' : 'orders'} in the queue.
          </p>
        </div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#B56124', background: '#F5E8D2', padding: '12px 20px', borderRadius: '16px', border: '2px solid #E6D0A9' }}>
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', opacity: 0.5 }}>
           <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#3B2213" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}>
             <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
           </svg>
           <h2 style={{ color: '#3B2213', fontSize: '24px', fontWeight: '900' }}>All Caught Up!</h2>
           <p style={{ color: '#3B2213', fontSize: '16px', fontWeight: '600' }}>The kitchen queue is empty.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {orders.map((order) => {
            const elapsed = getElapsedSeconds(order.created_at);
            
            // --- COLOR CODING LOGIC ---
            let statusConfig = {
              bg: '#fff',
              border: '#E6D0A9',
              timerColor: '#10b981', // Green
              timerBg: '#ecfdf5',
              animation: 'none'
            };

            if (elapsed >= 300) { // Over 5 minutes
              statusConfig = {
                bg: '#fef2f2',
                border: '#ef4444',
                timerColor: '#dc2626', // Red
                timerBg: '#fee2e2',
                animation: 'pulseUrgent 2s infinite'
              };
            } else if (elapsed >= 120) { // Over 2 minutes
              statusConfig = {
                bg: '#fffbeb',
                border: '#f59e0b',
                timerColor: '#d97706', // Orange
                timerBg: '#fef3c7',
                animation: 'none'
              };
            }

            // Parse the items_summary (e.g., "[DINE-IN] John - 2x Latte, 1x Cookie")
            const summaryParts = order.items_summary ? order.items_summary.split(' - ') : ['Unknown', 'No items'];
            const headerInfo = summaryParts[0]; // "[DINE-IN] John"
            const itemsList = summaryParts.length > 1 ? summaryParts.slice(1).join(' - ') : ''; // "2x Latte, 1x Cookie"
            
            // Split items by comma for cleaner rendering
            const individualItems = itemsList.split(', ');

            return (
              <div 
                key={order.id} 
                className="order-card"
                style={{ 
                  background: statusConfig.bg, 
                  border: `2px solid ${statusConfig.border}`, 
                  borderRadius: '24px', 
                  padding: '25px', 
                  boxShadow: '0 10px 25px rgba(59,34,19,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left', // <-- FIXED: Forces everything inside to align left
                  animation: `${statusConfig.animation}, fadeIn 0.3s ease-out`
                }}
              >
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px dashed ${statusConfig.border}`, paddingBottom: '15px', marginBottom: '15px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#B56124', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Order #{order.id.toString().slice(0, 5)}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#3B2213', marginTop: '4px' }}>
                      {headerInfo}
                    </div>
                  </div>
                  <div style={{ background: statusConfig.timerBg, color: statusConfig.timerColor, padding: '8px 12px', borderRadius: '12px', fontWeight: '900', fontSize: '16px', border: `1px solid ${statusConfig.border}` }}>
                    {formatTime(elapsed)}
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px', marginBottom: '25px', width: '100%' }}>
                  {individualItems.map((itemStr, idx) => {
                    // Extract qty to make it bold (e.g., "2x" from "2x Latte")
                    const match = itemStr.match(/^(\d+x)\s+(.*)/);
                    if (match) {
                      return (
                        <div key={idx} style={{ fontSize: '16px', color: '#3B2213', lineHeight: '1.4', textAlign: 'left', width: '100%' }}>
                          <span style={{ fontWeight: '900', color: '#B56124', marginRight: '8px' }}>{match[1]}</span>
                          <span style={{ fontWeight: '600' }}>{match[2]}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={idx} style={{ fontSize: '16px', color: '#3B2213', fontWeight: '600', lineHeight: '1.4', textAlign: 'left', width: '100%' }}>
                        {itemStr}
                      </div>
                    );
                  })}
                </div>

                <button 
                  onClick={() => markCompleted(order.id)}
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    borderRadius: '16px', 
                    border: 'none', 
                    background: '#3B2213', 
                    color: '#fff', 
                    fontWeight: '900', 
                    fontSize: '15px', 
                    cursor: 'pointer', 
                    boxShadow: '0 8px 15px rgba(59, 34, 19, 0.2)',
                    transition: 'transform 0.1s' 
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Mark as Completed
                </button>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}