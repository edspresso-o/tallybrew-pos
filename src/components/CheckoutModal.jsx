import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // NEW: Imported to fetch the branch name

export default function CheckoutModal({ isOpen, onClose, total, onConfirm, cart, discount }) {
  const [receivedAmount, setReceivedAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('dine-in');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [showReceipt, setShowReceipt] = useState(false);
  
  // GCash specific state
  const [gcashReference, setGcashReference] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  // --- NEW: Store the actual text name of the branch ---
  const [branchName, setBranchName] = useState('');

  // Load the saved QR code and Branch Name when the modal opens
  useEffect(() => {
    if (isOpen) {
      const savedQr = localStorage.getItem('tallybrew_gcash_qr');
      if (savedQr) setQrCodeUrl(savedQr);

      // Fetch the branch name for the receipt header
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

  const change = parseFloat(receivedAmount) - total;
  
  // Must have enough cash OR a GCash reference number to proceed
  const isPaid = paymentMethod === 'GCash' 
    ? gcashReference.length >= 4 
    : (parseFloat(receivedAmount) >= total);

  // Handle uploading and saving the QR code
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCodeUrl(reader.result);
        localStorage.setItem('tallybrew_gcash_qr', reader.result); // Saves it forever!
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
    const finalReceived = paymentMethod === 'GCash' ? total.toString() : receivedAmount;
    
    // Attach the Reference Number to the customer's name for the database
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
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250); 
  };

  return (
    <div className="popup-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(59, 34, 19, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      
      {!showReceipt ? (
        <div style={{ backgroundColor: '#fff', padding: '35px', borderRadius: '24px', width: '450px', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.4)', animation: 'popIn 0.2s', fontFamily: "'Inter', sans-serif" }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#111', margin: 0, letterSpacing: '-0.5px' }}>Checkout Payment</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '28px', color: '#9ca3af', cursor: 'pointer', lineHeight: '1' }}>&times;</button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {['dine-in', 'takeout'].map(type => {
              const isActive = orderType === type;
              return (
                <button 
                  key={type} 
                  onClick={() => setOrderType(type)} 
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease', border: isActive ? '2px solid #B56124' : '2px solid #f3f4f6', background: '#fff', color: isActive ? '#B56124' : '#6b7280' }}
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
            style={{ width: '100%', padding: '16px', boxSizing: 'border-box', border: '2px solid #f3f4f6', borderRadius: '12px', marginBottom: '25px', fontSize: '15px', fontWeight: '600', color: '#111', outline: 'none', transition: 'border-color 0.2s' }}
            onFocus={(e) => e.target.style.borderColor = '#B56124'}
            onBlur={(e) => e.target.style.borderColor = '#f3f4f6'}
          />

          <div style={{ background: '#f9fafb', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <span style={{ fontSize: '15px', color: '#6b7280', fontWeight: '700' }}>Amount Payable</span>
            <span style={{ fontSize: '32px', color: '#111', fontWeight: '900', letterSpacing: '-1px' }}>₱{total.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
            <button onClick={() => { setPaymentMethod('Cash'); setGcashReference(''); }} style={{ flex: 1, padding: '16px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: '0.2s', border: paymentMethod === 'Cash' ? '2px solid #B56124' : '2px solid #f3f4f6', background: '#fff', color: paymentMethod === 'Cash' ? '#B56124' : '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>$</span> Cash
            </button>
            <button onClick={() => { setPaymentMethod('GCash'); setReceivedAmount(''); }} style={{ flex: 1, padding: '16px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: '0.2s', border: paymentMethod === 'GCash' ? '2px solid #007DFE' : '2px solid #f3f4f6', background: '#fff', color: paymentMethod === 'GCash' ? '#007DFE' : '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect><line x1="8" y1="10" x2="16" y2="10"></line><line x1="8" y1="14" x2="16" y2="14"></line></svg>
              GCash
            </button>
          </div>

          {paymentMethod === 'Cash' ? (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <input 
                  type="number" 
                  placeholder="Enter cash amount..." 
                  value={receivedAmount} 
                  onChange={(e) => setReceivedAmount(e.target.value)} 
                  style={{ width: '100%', padding: '16px', boxSizing: 'border-box', border: '2px solid #f3f4f6', borderRadius: '12px', fontSize: '16px', fontWeight: '800', color: '#111', outline: 'none' }} 
                  autoFocus
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <span style={{ fontSize: '15px', color: '#6b7280', fontWeight: '700' }}>Change Due</span>
                <span style={{ fontSize: '20px', fontWeight: '900', color: receivedAmount && change >= 0 ? '#10b981' : '#6b7280' }}>
                  {receivedAmount ? (change >= 0 ? `₱${change.toFixed(2)}` : 'Insufficient') : '₱0.00'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s', textAlign: 'center', marginBottom: '25px' }}>
              {qrCodeUrl ? (
                <>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '15px', padding: '10px', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #007DFE' }}>
                    <img src={qrCodeUrl} alt="Store GCash QR" style={{ width: '220px', height: '220px', objectFit: 'contain', borderRadius: '8px' }} />
                    <button 
                      onClick={handleRemoveQr} 
                      style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    >
                      &times;
                    </button>
                  </div>
                  
                  <p style={{ color: '#111', fontSize: '14px', fontWeight: '800', marginTop: '0', marginBottom: '15px' }}>Customer scans to pay ₱{total.toFixed(2)}</p>

                  <input 
                    type="text" 
                    placeholder="Enter GCash Ref. No." 
                    value={gcashReference} 
                    onChange={(e) => setGcashReference(e.target.value.replace(/[^0-9]/g, ''))} 
                    style={{ width: '100%', padding: '16px', boxSizing: 'border-box', border: '2px solid #007DFE', borderRadius: '12px', fontSize: '18px', fontWeight: '900', color: '#111', outline: 'none', textAlign: 'center', letterSpacing: '1px' }} 
                  />
                </>
              ) : (
                <label style={{ display: 'block', border: '2px dashed #007DFE', borderRadius: '16px', padding: '30px', cursor: 'pointer', background: '#eff6ff', transition: '0.2s' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#007DFE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  <div style={{ color: '#007DFE', fontWeight: '900', fontSize: '15px' }}>Upload Store GCash QR</div>
                  <div style={{ color: '#3b82f6', fontWeight: '600', fontSize: '12px', marginTop: '4px' }}>(Saves permanently to this device)</div>
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          )}

          <button 
            onClick={handleProcessPayment} 
            disabled={!isPaid} 
            style={{ width: '100%', padding: '18px', borderRadius: '12px', border: 'none', background: isPaid ? (paymentMethod === 'GCash' ? '#007DFE' : '#e5e7eb') : '#f3f4f6', color: isPaid ? (paymentMethod === 'GCash' ? '#fff' : '#111') : '#9ca3af', fontSize: '15px', fontWeight: '900', cursor: isPaid ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: isPaid && paymentMethod === 'GCash' ? '0 4px 12px rgba(0, 125, 254, 0.3)' : 'none' }}
          >
            CONFIRM PAYMENT
          </button>

        </div>
      ) : (
        
        <div style={{ backgroundColor: '#fff', padding: '0', borderRadius: '12px', width: '380px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', animation: 'popIn 0.3s', overflow: 'hidden' }}>
          <div id="receipt-core" style={{ padding: '40px 30px', borderBottom: '2px dashed #e5e7eb', background: '#fff' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img src={`${import.meta.env.BASE_URL}images/TallyBrewPos.png`} alt="TallyBrew Logo" style={{ maxWidth: '180px', width: '100%', height: 'auto', margin: '0 auto 5px auto', display: 'block' }} />
              
              {/* --- NEW: Injected the dynamic Branch Name --- */}
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
              <span>₱{total.toFixed(2)}</span>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dotted #9ca3af', fontSize: '12px', color: '#444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Paid via {paymentMethod}</span>
                <span>₱{paymentMethod === 'GCash' ? total.toFixed(2) : parseFloat(receivedAmount).toFixed(2)}</span>
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