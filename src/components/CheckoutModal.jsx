import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 

export default function CheckoutModal({ isOpen, onClose, total, onConfirm, cart, discount }) {
  const [receivedAmount, setReceivedAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('dine-in');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderId] = useState(Math.floor(100000 + Math.random() * 900000)); 
  
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

  const handlePrintAndSave = () => {
    const receiptHTML = document.getElementById('receipt-core').innerHTML;
    const printWindow = window.open('', '', 'height=800,width=400');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>TallyBrew Receipt</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Lobster&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
            
            @page { margin: 0; }
            body { 
              margin: 0; 
              padding: 5mm; 
              font-family: 'Inter', sans-serif; 
              color: #000; 
              background: #fff;
              width: 76mm; 
              font-size: 12px;
            }
            .receipt-container { width: 100%; }
            .cut-line { 
              margin: 8mm 0; 
              border-bottom: 1px dashed #000; 
              text-align: center; 
              font-size: 10px;
              color: #000;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${receiptHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 400); 
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    handleFinishOrder();
  };

  return (
    <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '15px' }}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lobster&display=swap');
        .hide-arrows::-webkit-outer-spin-button,
        .hide-arrows::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .hide-arrows { -moz-appearance: textfield; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        
        .quick-cash-btn { flex: 1; padding: 10px 4px; border-radius: 8px; background: #E6D0A9; border: none; color: #3B2213; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; white-space: nowrap; }
        .quick-cash-btn:hover { background: #D5B888; }
        .quick-cash-btn:active { transform: scale(0.95); }

        /* Custom Scrollbar to hide it visually but keep functionality */
        .mobile-scroll::-webkit-scrollbar { display: none; }
        .mobile-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        
        .receipt-scroll::-webkit-scrollbar { width: 6px; }
        .receipt-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .receipt-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
      `}</style>
      
      {!showReceipt ? (
        
        // --- RESPONSIVE PAYMENT SCREEN ---
        <div className="mobile-scroll" style={{ backgroundColor: '#FDFBF7', padding: '20px', borderRadius: '24px', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', animation: 'popIn 0.3s', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#3B2213', margin: 0, letterSpacing: '-0.5px' }}>Checkout Payment</h2>
            <button onClick={onClose} style={{ background: '#E6D0A9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', color: '#3B2213', fontSize: '18px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>&times;</button>
          </div>

          <div style={{ display: 'flex', background: '#F5E8D2', padding: '4px', borderRadius: '12px', gap: '4px', marginBottom: '15px' }}>
            {['dine-in', 'takeout'].map(type => {
              const isActive = orderType === type;
              return (
                <button 
                  key={type} 
                  onClick={() => setOrderType(type)} 
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: isActive ? '#fff' : 'transparent', color: isActive ? '#3B2213' : '#B56124', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: isActive ? '0 4px 10px rgba(59,34,19,0.1)' : 'none', transition: 'all 0.2s' }}
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
            style={{ width: '100%', padding: '12px 16px', boxSizing: 'border-box', border: '2px solid #E6D0A9', borderRadius: '12px', marginBottom: '15px', fontSize: '14px', fontWeight: '700', color: '#3B2213', outline: 'none', transition: 'border-color 0.2s', background: '#fff' }}
            onFocus={(e) => e.target.style.borderColor = '#B56124'}
            onBlur={(e) => e.target.style.borderColor = '#E6D0A9'}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px 20px', borderRadius: '16px', border: '2px dashed #B56124', marginBottom: '15px' }}>
            <span style={{ fontSize: '12px', fontWeight: '900', color: '#B56124', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount Payable</span>
            <span style={{ fontSize: '28px', fontWeight: '900', color: '#3B2213', letterSpacing: '-1px' }}>₱{totalAmount.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
            <button 
              onClick={() => { setPaymentMethod('Cash'); setGcashReference(''); }} 
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '12px', borderRadius: '12px', border: paymentMethod === 'Cash' ? '2px solid #3B2213' : '2px solid #E6D0A9', background: paymentMethod === 'Cash' ? '#3B2213' : '#fff', color: paymentMethod === 'Cash' ? '#fff' : '#3B2213', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', boxShadow: paymentMethod === 'Cash' ? '0 8px 16px rgba(59,34,19,0.2)' : 'none' }}
            >
              <span style={{ fontSize: '18px', fontWeight: '900' }}>₱</span> Cash
            </button>
            <button 
              onClick={() => { setPaymentMethod('GCash'); setReceivedAmount(''); }} 
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '12px', borderRadius: '12px', border: paymentMethod === 'GCash' ? '2px solid #2563eb' : '2px solid #E6D0A9', background: paymentMethod === 'GCash' ? '#2563eb' : '#fff', color: paymentMethod === 'GCash' ? '#fff' : '#3B2213', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', boxShadow: paymentMethod === 'GCash' ? '0 8px 16px rgba(37,99,235,0.2)' : 'none' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              GCash
            </button>
          </div>

          {paymentMethod === 'Cash' ? (
            <div style={{ animation: 'popIn 0.2s' }}>
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', fontWeight: '900', color: '#B56124' }}>₱</span>
                <input 
                  type="number" 
                  className="hide-arrows"
                  placeholder="0.00" 
                  value={receivedAmount} 
                  onChange={(e) => setReceivedAmount(e.target.value)} 
                  style={{ width: '100%', padding: '14px 16px 14px 40px', boxSizing: 'border-box', border: '2px solid #E6D0A9', borderRadius: '12px', fontSize: '20px', fontWeight: '900', color: '#3B2213', outline: 'none', background: '#fff', transition: 'border-color 0.2s' }} 
                  onFocus={(e) => e.target.style.borderColor = '#B56124'}
                  onBlur={(e) => e.target.style.borderColor = '#E6D0A9'}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '4px', marginBottom: '15px' }}>
                <button className="quick-cash-btn" onClick={() => setReceivedAmount(totalAmount)}>Exact</button>
                <button className="quick-cash-btn" onClick={() => setReceivedAmount(100)}>100</button>
                <button className="quick-cash-btn" onClick={() => setReceivedAmount(200)}>200</button>
                <button className="quick-cash-btn" onClick={() => setReceivedAmount(500)}>500</button>
                <button className="quick-cash-btn" onClick={() => setReceivedAmount(1000)}>1000</button>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '0 5px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Change Due</span>
                <span style={{ fontSize: '18px', fontWeight: '900', color: receivedAmount && change >= 0 ? '#10b981' : '#9ca3af' }}>
                  {receivedAmount ? (change >= 0 ? `₱${change.toFixed(2)}` : 'Insufficient') : '₱0.00'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ animation: 'popIn 0.2s', textAlign: 'center', marginBottom: '15px' }}>
              {qrCodeUrl ? (
                <>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '10px', padding: '8px', background: '#fff', borderRadius: '16px', border: '2px dashed #2563eb' }}>
                    <img src={qrCodeUrl} alt="Store GCash QR" style={{ width: '150px', height: '150px', objectFit: 'contain', borderRadius: '12px' }} />
                    <button 
                      onClick={handleRemoveQr} 
                      style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}
                    >
                      &times;
                    </button>
                  </div>
                  
                  <p style={{ color: '#1e3a8a', fontSize: '13px', fontWeight: '800', marginTop: '0', marginBottom: '10px' }}>Customer scans to pay ₱{totalAmount.toFixed(2)}</p>

                  <input 
                    type="text" 
                    placeholder="Enter GCash Ref. No." 
                    value={gcashReference} 
                    onChange={(e) => setGcashReference(e.target.value.replace(/[^0-9]/g, ''))} 
                    style={{ width: '100%', padding: '14px', boxSizing: 'border-box', border: '2px solid #2563eb', borderRadius: '12px', fontSize: '16px', fontWeight: '900', color: '#1e3a8a', outline: 'none', textAlign: 'center', letterSpacing: '1px', background: '#eff6ff' }} 
                  />
                </>
              ) : (
                <label style={{ display: 'block', border: '2px dashed #2563eb', borderRadius: '16px', padding: '20px', cursor: 'pointer', background: '#eff6ff', transition: '0.2s' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  <div style={{ color: '#2563eb', fontWeight: '900', fontSize: '14px' }}>Upload Store GCash QR</div>
                  <div style={{ color: '#3b82f6', fontWeight: '600', fontSize: '11px', marginTop: '4px' }}>(Saves permanently to this device)</div>
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          )}

          <button 
            onClick={handleProcessPayment} 
            disabled={!isPaid} 
            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: isPaid ? (paymentMethod === 'GCash' ? '#2563eb' : '#3B2213') : '#e5e7eb', color: isPaid ? '#fff' : '#9ca3af', fontSize: '15px', fontWeight: '900', cursor: isPaid ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: isPaid ? (paymentMethod === 'GCash' ? '0 8px 20px rgba(37,99,235,0.3)' : '0 8px 20px rgba(59,34,19,0.3)') : 'none', textTransform: 'uppercase', letterSpacing: '1px' }}
          >
            Confirm Payment
          </button>

        </div>
        
      ) : (
        
        // --- ENHANCED DUAL RECEIPT PREVIEW ---
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '380px', maxHeight: '90vh', animation: 'popIn 0.3s' }}>
          
          <div className="receipt-scroll" style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', overflowY: 'auto', marginBottom: '15px' }}>
            <div id="receipt-core" style={{ padding: '30px 25px', background: '#fff', color: '#111', fontFamily: "'Inter', sans-serif" }}>
              
              {['STORE COPY', 'CUSTOMER COPY'].map((copyType, index) => (
                <div key={copyType}>
                  
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontWeight: '800', fontSize: '11px', color: '#6b7280', letterSpacing: '1px', marginBottom: '15px' }}>*** {copyType} ***</div>
                    
                    <img 
        src={`${import.meta.env.BASE_URL}images/TallyBrewPosLogo.png`} 
        alt="TallyBrew Logo" 
        style={{ width: '100%', maxWidth: '200px', maxHeight: '150px', objectFit: 'contain', marginBottom: '20px' }} 
      />
                    
                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {branchName || 'Main Branch'}
                    </p>

                    <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: '600', marginBottom: '4px' }}>
                      {new Date().toLocaleDateString()} &nbsp;|&nbsp; {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#111' }}>
                      Order #: TB-{orderId}
                    </div>
                  </div>

                  <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px', marginBottom: '20px', border: '1px dashed #d1d5db' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800', marginBottom: '4px' }}>
                      <span style={{ color: '#6b7280' }}>Type:</span>
                      <span style={{ color: '#B56124', textTransform: 'uppercase' }}>{orderType === 'dine-in' ? 'DINE IN' : 'TAKE OUT'}</span>
                    </div>
                    {customerName && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '800' }}>
                        <span style={{ color: '#6b7280' }}>Customer:</span>
                        <span>{customerName}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '2px solid #111', borderBottom: '2px solid #111', padding: '12px 0', marginBottom: '15px' }}>
                    {cart.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '700' }}>
                        <span style={{ flex: 1, paddingRight: '15px', lineHeight: '1.4' }}>{item.qty}x {item.name}</span>
                        <span>₱{(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderBottom: '1px dashed #d1d5db', paddingBottom: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: '#4b5563', marginBottom: '6px' }}>
                      <span>Subtotal</span>
                      <span>₱{cart.reduce((s, i) => s + (i.price * i.qty), 0).toFixed(2)}</span>
                    </div>
                    {discount.rate > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#dc2626', marginBottom: '6px' }}>
                        <span>Discount ({discount.label})</span>
                        <span>- ₱{(cart.reduce((s, i) => s + (i.price * i.qty), 0) * discount.rate).toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '20px', fontWeight: '900', color: '#111' }}>
                      <span>TOTAL</span>
                      <span>₱{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div style={{ paddingBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: '#4b5563', marginBottom: '4px' }}>
                      <span>Paid via {paymentMethod}</span>
                      <span>₱{paymentMethod === 'GCash' ? totalAmount.toFixed(2) : parseFloat(receivedAmount).toFixed(2)}</span>
                    </div>
                    
                    {paymentMethod === 'Cash' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '13px', color: '#111' }}>
                        <span>Change</span>
                        <span>₱{change.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {paymentMethod === 'GCash' && gcashReference && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#111', marginTop: '4px' }}>
                        <span>Ref No.</span>
                        <span>{gcashReference}</span>
                      </div>
                    )}
                  </div>
                  
                  {index === 0 && (
                    <div className="cut-line" style={{ margin: '25px 0', borderBottom: '1px dashed #9ca3af', position: 'relative', textAlign: 'center' }}>
                      <span style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 10px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', letterSpacing: '2px' }}>
                        ✂ CUT HERE ✂
                      </span>
                    </div>
                  )}

                  {index === 1 && (
                     <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>
                       Thank you for visiting!<br/>See you again soon.
                     </div>
                  )}

                </div>
              ))}
              
            </div>
          </div>

          <button 
            onClick={handlePrintAndSave} 
            style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#3B2213', color: '#FDFBF7', fontSize: '15px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 8px 20px rgba(59, 34, 19, 0.5)', transition: 'all 0.2s', letterSpacing: '0.5px' }}
          >
            Done & Save Order
          </button>

        </div>
      )}
    </div>
  );
}