import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

export default function CheckoutModal({ isOpen, onClose, total, onConfirm, cart, discount }) {
  const [receivedAmount, setReceivedAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('dine-in');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [showReceipt, setShowReceipt] = useState(false);
  
 
  const [gcashReference, setGcashReference] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  const [branchName, setBranchName] = useState('');

  
  useEffect(() => {
    if (isOpen) {
      const savedQr = localStorage.getItem('tallybrew_gcash_qr');
      if (savedQr) setQrCodeUrl(savedQr);

      const fetchBranchName = async () => {
        const activeBranchId = localStorage.getItem('tallybrew_branch');
        if (activeBranchId && activeBranchId !== 'admin_remote') {
          const { data } = await supabase.from('branches').select('name').eq('id', activeBranchId).single();
          if (data) setBranchName(data.name);
        }
      };
      fetchBranchName();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalAmount = Number(total);
  const change = parseFloat(receivedAmount) - totalAmount;

  const isPaid = paymentMethod === 'GCash' 
    ? gcashReference.length >= 4 
    : (parseFloat(receivedAmount) >= totalAmount);

  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCodeUrl(reader.result);
        localStorage.setItem('tallybrew_gcash_qr', reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveQr = () => {
    setQrCodeUrl(null);
    localStorage.removeItem('tallybrew_gcash_qr');
  };

  const handleProcessPayment = () => {
    if (isPaid) setShowReceipt(true);
  };

  const handleFinishOrder = () => {
    const finalReceived = paymentMethod === 'GCash' ? totalAmount.toString() : receivedAmount;
    
  
    const finalCustomerName = paymentMethod === 'GCash' 
      ? `${customerName || 'Guest'} (Ref: ${gcashReference})` 
      : customerName;

    onConfirm(paymentMethod, finalReceived, finalCustomerName, orderType);
  };

  const handlePrint = () => {
    const receiptHTML = document.getElementById('receipt-core').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=400');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>TallyBrew Receipt</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Lobster&display=swap');
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: 'Courier New', Courier, monospace; 
              color: #000; 
              background: #fff;
            }
          </style>
        </head>
        <body>
          ${receiptHTML}
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 250); 
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
      
      {}
      <style>{`
        .hide-arrows::-webkit-outer-spin-button,
        .hide-arrows::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .hide-arrows { -moz-appearance: textfield; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        
        .quick-cash-btn { flex: 1; padding: 10px; border-radius: 10px; background: #E6D0A9; border: none; color: #3B2213; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.2s; }
        .quick-cash-btn:hover { background: #D5B888; }
        .quick-cash-btn:active { transform: scale(0.95); }
      `}</style>
      
      {!showReceipt ? (
        
        <div style={{ backgroundColor: '#FDFBF7', padding: '35px', borderRadius: '32px', width: '420px', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', animation: 'popIn 0.3s', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#3B2213', margin: 0, letterSpacing: '-0.5px' }}>Checkout Payment</h2>
            <button onClick={onClose} style={{ background: '#E6D0A9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: '#3B2213', fontSize: '20px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>&times;</button>
          </div>

          <div style={{ display: 'flex', background: '#F5E8D2', padding: '6px', borderRadius: '16px', gap: '6px', marginBottom: '20px' }}>
            {['dine-in', 'takeout'].map(type => {
              const isActive = orderType === type;
              return (
                <button 
                  key={type} 
                  onClick={() => setOrderType(type)} 
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: isActive ? '#fff' : 'transparent', color: isActive ? '#3B2213' : '#B56124', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: isActive ? '0 4px 10px rgba(59,34,19,0.1)' : 'none', transition: 'all 0.2s' }}
                >
                  {type === 'dine-in' ? 'Dine In' : 'Take Out'}
                </button>
              );
            })}
          </div>

          <input 
            type="text" 
            placeholder="Customer Name (Optional)" 
            value={customerName} 
            onChange={(e) => setCustomerName(e.target.value)} 
            style={{ width: '100%', padding: '16px 20px', boxSizing: 'border-box', border: '2px solid #E6D0A9', borderRadius: '16px', marginBottom: '20px', fontSize: '15px', fontWeight: '700', color: '#3B2213', outline: 'none', transition: 'border-color 0.2s', background: '#fff' }}
            onFocus={(e) => e.target.style.borderColor = '#B56124'}
            onBlur={(e) => e.target.style.borderColor = '#E6D0A9'}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '20px 25px', borderRadius: '20px', border: '2px dashed #B56124', marginBottom: '20px' }}>
            <span style={{ fontSize: '13px', fontWeight: '900', color: '#B56124', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount Payable</span>
            <span style={{ fontSize: '32px', fontWeight: '900', color: '#3B2213', letterSpacing: '-1px' }}>₱{totalAmount.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button 
              onClick={() => { setPaymentMethod('Cash'); setGcashReference(''); }} 
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', borderRadius: '16px', border: paymentMethod === 'Cash' ? '2px solid #3B2213' : '2px solid #E6D0A9', background: paymentMethod === 'Cash' ? '#3B2213' : '#fff', color: paymentMethod === 'Cash' ? '#fff' : '#3B2213', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', boxShadow: paymentMethod === 'Cash' ? '0 8px 16px rgba(59,34,19,0.2)' : 'none' }}
            >
              <span style={{ fontSize: '20px', fontWeight: '900' }}>₱</span> Cash
            </button>
            <button 
              onClick={() => { setPaymentMethod('GCash'); setReceivedAmount(''); }} 
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', borderRadius: '16px', border: paymentMethod === 'GCash' ? '2px solid #2563eb' : '2px solid #E6D0A9', background: paymentMethod === 'GCash' ? '#2563eb' : '#fff', color: paymentMethod === 'GCash' ? '#fff' : '#3B2213', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', boxShadow: paymentMethod === 'GCash' ? '0 8px 16px rgba(37,99,235,0.2)' : 'none' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              GCash
            </button>
          </div>

          {paymentMethod === 'Cash' ? (
            <div style={{ animation: 'popIn 0.2s' }}>
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '20px', fontWeight: '900', color: '#B56124' }}>₱</span>
                <input 
                  type="number" 
                  className="hide-arrows"
                  placeholder="0.00" 
                  value={receivedAmount} 
                  onChange={(e) => setReceivedAmount(e.target.value)} 
                  style={{ width: '100%', padding: '18px 20px 18px 45px', boxSizing: 'border-box', border: '2px solid #E6D0A9', borderRadius: '16px', fontSize: '24px', fontWeight: '900', color: '#3B2213', outline: 'none', background: '#fff', transition: 'border-color 0.2s' }} 
                  onFocus={(e) => e.target.style.borderColor = '#B56124'}
                  onBlur={(e) => e.target.style.borderColor = '#E6D0A9'}
                  autoFocus
                />
              </div>

              {}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '15px' }}>
                <button className="quick-cash-btn" onClick={() => setReceivedAmount(totalAmount)}>Exact</button>
                <button className="quick-cash-btn" onClick={() => setReceivedAmount(100)}>100</button>
                <button className="quick-cash-btn" onClick={() => setReceivedAmount(200)}>200</button>
                <button className="quick-cash-btn" onClick={() => setReceivedAmount(500)}>500</button>
                <button className="quick-cash-btn" onClick={() => setReceivedAmount(1000)}>1000</button>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', padding: '0 5px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Change Due</span>
                <span style={{ fontSize: '20px', fontWeight: '900', color: receivedAmount && change >= 0 ? '#10b981' : '#9ca3af' }}>
                  {receivedAmount ? (change >= 0 ? `₱${change.toFixed(2)}` : 'Insufficient') : '₱0.00'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ animation: 'popIn 0.2s', textAlign: 'center', marginBottom: '25px' }}>
              {qrCodeUrl ? (
                <>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '15px', padding: '10px', background: '#fff', borderRadius: '20px', border: '2px dashed #2563eb' }}>
                    <img src={qrCodeUrl} alt="Store GCash QR" style={{ width: '200px', height: '200px', objectFit: 'contain', borderRadius: '12px' }} />
                    <button 
                      onClick={handleRemoveQr} 
                      style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}
                    >
                      &times;
                    </button>
                  </div>
                  
                  <p style={{ color: '#1e3a8a', fontSize: '14px', fontWeight: '800', marginTop: '0', marginBottom: '15px' }}>Customer scans to pay ₱{totalAmount.toFixed(2)}</p>

                  <input 
                    type="text" 
                    placeholder="Enter GCash Ref. No." 
                    value={gcashReference} 
                    onChange={(e) => setGcashReference(e.target.value.replace(/[^0-9]/g, ''))} 
                    style={{ width: '100%', padding: '16px', boxSizing: 'border-box', border: '2px solid #2563eb', borderRadius: '16px', fontSize: '18px', fontWeight: '900', color: '#1e3a8a', outline: 'none', textAlign: 'center', letterSpacing: '1px', background: '#eff6ff' }} 
                  />
                </>
              ) : (
                <label style={{ display: 'block', border: '2px dashed #2563eb', borderRadius: '20px', padding: '30px', cursor: 'pointer', background: '#eff6ff', transition: '0.2s' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  <div style={{ color: '#2563eb', fontWeight: '900', fontSize: '15px' }}>Upload Store GCash QR</div>
                  <div style={{ color: '#3b82f6', fontWeight: '600', fontSize: '12px', marginTop: '4px' }}>(Saves permanently to this device)</div>
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          )}

          <button 
            onClick={handleProcessPayment} 
            disabled={!isPaid} 
            style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: isPaid ? (paymentMethod === 'GCash' ? '#2563eb' : '#3B2213') : '#e5e7eb', color: isPaid ? '#fff' : '#9ca3af', fontSize: '16px', fontWeight: '900', cursor: isPaid ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: isPaid ? (paymentMethod === 'GCash' ? '0 8px 20px rgba(37,99,235,0.3)' : '0 8px 20px rgba(59,34,19,0.3)') : 'none', textTransform: 'uppercase', letterSpacing: '1px' }}
          >
            Confirm Payment
          </button>

        </div>
        
      ) : (
        
      
        <div style={{ backgroundColor: '#fff', padding: '0', borderRadius: '12px', width: '380px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', animation: 'popIn 0.3s', overflow: 'hidden' }}>
          <div id="receipt-core" style={{ padding: '40px 30px', borderBottom: '2px dashed #e5e7eb', background: '#fff' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img src={`${import.meta.env.BASE_URL}images/TallyBrewPos.png`} alt="TallyBrew Logo" style={{ maxWidth: '180px', width: '100%', height: 'auto', margin: '0 auto 5px auto', display: 'block' }} />
              
              {branchName && (
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#111', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {branchName}
                </p>
              )}

              <p style={{ margin: 0, fontSize: '12px', color: '#444', fontWeight: '600' }}>{new Date().toLocaleString()}</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#444', fontWeight: '600' }}>Order: {orderType === 'dine-in' ? 'DINE IN' : 'TAKE OUT'}</p>
              {customerName && <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#444', fontWeight: '600' }}>Customer: {customerName}</p>}
            </div>

            <div style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '15px 0', margin: '20px 0' }}>
              {cart.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#111' }}>
                  <span>{item.qty}x {item.name}</span>
                  <span>₱{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px', color: '#444' }}>
              <span>Subtotal</span>
              <span>₱{cart.reduce((s, i) => s + (i.price * i.qty), 0).toFixed(2)}</span>
            </div>
            {discount.rate > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: '#dc2626' }}>
                <span>Discount ({discount.label})</span>
                <span>- ₱{(cart.reduce((s, i) => s + (i.price * i.qty), 0) * discount.rate).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '18px', fontWeight: '900', color: '#111' }}>
              <span>TOTAL</span>
              <span>₱{totalAmount.toFixed(2)}</span>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dotted #9ca3af', fontSize: '12px', color: '#444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Paid via {paymentMethod}</span>
                <span>₱{paymentMethod === 'GCash' ? totalAmount.toFixed(2) : parseFloat(receivedAmount).toFixed(2)}</span>
              </div>
              {paymentMethod === 'Cash' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#111' }}>
                  <span>Change</span>
                  <span>₱{change.toFixed(2)}</span>
                </div>
              )}
              {paymentMethod === 'GCash' && gcashReference && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', color: '#6b7280', marginTop: '4px' }}>
                  <span>Ref No.</span>
                  <span>{gcashReference}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', padding: '20px', gap: '10px', background: '#f9fafb' }}>
            <button onClick={handlePrint} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '2px solid #e5e7eb', background: '#fff', color: '#4b5563', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}>Print</button>
            <button onClick={handleFinishOrder} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#3B2213', color: '#FDFBF7', fontSize: '14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 10px rgba(59, 34, 19, 0.2)' }}>Done & Save Order</button>
          </div>
        </div>
      )}
    </div>
  );
}