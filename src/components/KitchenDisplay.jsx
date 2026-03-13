import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function KitchenDisplay() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch pending orders and their items
  const fetchOrders = async () => {
    try {
      // We use Supabase's ability to fetch a sale AND its matching sale_items at the same time
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (*)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true }); // Oldest orders first!

      if (error) throw error;
      setActiveOrders(data || []);
    } catch (error) {
      console.error("Error fetching kitchen orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Set up an auto-refresh so the screen updates every 5 seconds!
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // When the barista finishes making the drinks
  const markAsComplete = async (saleId) => {
    try {
      // Optimistic UI update (instantly remove from screen for a snappy feel)
      setActiveOrders(prev => prev.filter(order => order.id !== saleId));

      // Tell the database it's done
      const { error } = await supabase
        .from('sales')
        .update({ status: 'completed' })
        .eq('id', saleId);

      if (error) throw error;
    } catch (error) {
      console.error("Error completing order:", error);
      fetchOrders(); // Re-fetch if it failed
    }
  };

  // Format the time so the barista knows how long the customer has been waiting
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center', fontWeight: 'bold' }}>Loading Kitchen Display...</div>;

  return (
    <div style={{ padding: '20px', flex: 1, width: '100%', boxSizing: 'border-box', backgroundColor: '#e5e7eb', minHeight: '100vh', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#111', letterSpacing: '-1px' }}>
          Kitchen Display
        </h1>
        <div style={{ background: '#b85e2b', color: 'white', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold' }}>
          {activeOrders.length} Pending Orders
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '16px', color: '#9ca3af', fontWeight: 'bold', fontSize: '20px' }}>
          No pending orders.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          
          {activeOrders.map(order => (
            <div key={order.id} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column' }}>
              
              {/* Order Header (Looks like a printed ticket header) */}
              <div style={{ backgroundColor: '#fdfbf7', borderBottom: '2px dashed #e5e7eb', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Order #{order.id}
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

              {/* Order Items List */}
              <div style={{ padding: '15px', flex: 1 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {order.sale_items && order.sale_items.map(item => (
                    <li key={item.id} style={{ marginBottom: '12px', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{ backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '6px', fontWeight: '900', color: '#3b2213' }}>
                          {item.quantity}x
                        </div>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '800', color: '#111' }}>
                            {item.product_name}
                          </div>
                          {/* If there are modifiers like Size or Add-ons, show them in red so the barista doesn't miss them! */}
                          {item.modifiers && (
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>
                              {item.modifiers}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Complete Button */}
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