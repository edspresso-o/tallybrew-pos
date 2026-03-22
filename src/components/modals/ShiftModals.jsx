import React from 'react';

export function StartShiftModal({ 
  showStartShift, setShowStartShift, setPendingCashier, 
  startingCashInput, setStartingCashInput, openRegister 
}) {
  if (!showStartShift) return null;

  return (
    <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10005, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#E6D0A9', borderRadius: '32px', padding: '40px 35px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', animation: 'popIn 0.3s' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#FDFBF7', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #3B2213', boxShadow: '0 8px 16px rgba(59,34,19,0.1)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 10px', color: '#3B2213', letterSpacing: '-0.5px' }}>Open Register</h2>
        <p style={{ color: '#3B2213', fontSize: '14px', marginBottom: '30px', fontWeight: '600', opacity: 0.8, lineHeight: '1.4' }}>Count the cash float in the drawer before starting your shift.</p>
        <div style={{ position: 'relative', width: '100%', marginBottom: '30px', textAlign: 'left', background: '#F5E8D2', borderRadius: '16px', border: '2px solid #3B2213', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#B56124', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Starting Cash (₱)</div>
            <input type="number" value={startingCashInput} onChange={(e) => setStartingCashInput(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '32px', fontWeight: '900', color: '#3B2213', padding: 0 }} autoFocus />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => { setShowStartShift(false); setPendingCashier(null); window.location.reload(); }} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#FDFBF7', color: '#3B2213', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={openRegister} disabled={!startingCashInput} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#B56124', color: '#FDFBF7', fontWeight: '900', fontSize: '15px', cursor: !startingCashInput ? 'not-allowed' : 'pointer', opacity: !startingCashInput ? 0.6 : 1, boxShadow: '0 4px 12px rgba(181, 97, 36, 0.3)' }}>Open Register</button>
        </div>
      </div>
    </div>
  );
}

export function EndShiftModal({ 
  showEndShift, setShowEndShift, shiftStats, activeCashier, 
  endingCashInput, setEndingCashInput, closeRegister 
}) {
  if (!showEndShift || !shiftStats) return null;

  return (
    <div className="popup-overlay no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10005, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#E6D0A9', borderRadius: '32px', padding: '40px 35px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', animation: 'popIn 0.3s' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#FDFBF7', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #3B2213', boxShadow: '0 8px 16px rgba(59,34,19,0.1)' }}>
           <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 10px', color: '#3B2213', letterSpacing: '-0.5px' }}>Close Register</h2>
        <p style={{ color: '#3B2213', fontSize: '14px', marginBottom: '25px', fontWeight: '600', opacity: 0.8 }}>Count the physical cash in the drawer to close <strong>{activeCashier?.username}</strong>'s shift.</p>
        <div style={{ background: '#F5E8D2', border: '2px solid #3B2213', borderRadius: '16px', padding: '15px 20px', marginBottom: '25px', textAlign: 'left' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ fontSize: '14px', color: '#3B2213', fontWeight: '700', opacity: 0.8 }}>Starting Float:</span><span style={{ fontSize: '14px', color: '#3B2213', fontWeight: '800' }}>₱ {shiftStats.startingCash.toFixed(2)}</span></div>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ fontSize: '14px', color: '#3B2213', fontWeight: '700', opacity: 0.8 }}>Cash Sales:</span><span style={{ fontSize: '14px', color: '#3B2213', fontWeight: '800' }}>+ ₱ {shiftStats.cashSales.toFixed(2)}</span></div>
           {shiftStats.cashDrops > 0 && (
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
               <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: '700', opacity: 0.8 }}>Cash Dropped (Skim):</span>
               <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: '800' }}>- ₱ {shiftStats.cashDrops.toFixed(2)}</span>
             </div>
           )}
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ fontSize: '12px', color: '#3B2213', fontWeight: '600', opacity: 0.6 }}>GCash Sales (Not in drawer):</span><span style={{ fontSize: '12px', color: '#3B2213', fontWeight: '600', opacity: 0.6 }}>₱ {shiftStats.gcashSales.toFixed(2)}</span></div>
           <div style={{ height: '2px', background: '#3B2213', opacity: 0.2, margin: '12px 0' }}></div>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '15px', color: '#B56124', fontWeight: '900', textTransform: 'uppercase' }}>Expected Cash:</span><span style={{ fontSize: '20px', color: '#B56124', fontWeight: '900' }}>₱ {shiftStats.expectedCash.toFixed(2)}</span></div>
        </div>
        <div style={{ position: 'relative', width: '100%', marginBottom: '30px', textAlign: 'left', background: '#FDFBF7', borderRadius: '16px', border: '2px solid #B56124', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 0 0 3px rgba(181,97,36,0.2)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#B56124', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Actual Counted Cash (₱)</div>
            <input type="number" value={endingCashInput} onChange={(e) => setEndingCashInput(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '32px', fontWeight: '900', color: '#3B2213', padding: 0 }} autoFocus />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowEndShift(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#FDFBF7', color: '#3B2213', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={closeRegister} disabled={!endingCashInput} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#3B2213', color: '#FDFBF7', fontWeight: '900', fontSize: '15px', cursor: !endingCashInput ? 'not-allowed' : 'pointer', opacity: !endingCashInput ? 0.6 : 1, boxShadow: '0 4px 12px rgba(59,34,19,0.3)' }}>Generate Report</button>
        </div>
      </div>
    </div>
  );
}

export function ShiftReportModal({ 
  showShiftReport, shiftStats, activeCashier, 
  handlePrintZReading, finalizeShiftAndLogout, baseUrl 
}) {
  if (!showShiftReport || !shiftStats) return null;

  return (
    <div className="popup-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10005, backgroundColor: 'rgba(59, 34, 19, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '30px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(59, 34, 19, 0.5)', animation: 'popIn 0.3s', display: 'flex', flexDirection: 'column' }}>
         <div id="printable-z-read" style={{ color: '#000', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <img src={`${baseUrl}images/TallyBrewPosLogo.png`} alt="TallyBrew Logo" style={{ width: '130px', display: 'block', margin: '0 auto 10px', filter: 'grayscale(100%) contrast(200%)' }} />
              <h3 style={{ margin: '0 0 10px', fontSize: '18px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>Z-READING REPORT</h3>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Cashier:</strong> {activeCashier?.username}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Start:</strong> {new Date(shiftStats.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>End:</strong> {new Date(shiftStats.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              <div style={{ borderBottom: '1px dashed #000', margin: '15px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '14px' }}><span>Transactions:</span><span>{shiftStats.transactions}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '14px' }}><span>Discounts Applied:</span><span>{shiftStats.discountCount}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '14px' }}><span>GCash Sales:</span><span>₱ {shiftStats.gcashSales.toFixed(2)}</span></div>
              <div style={{ borderBottom: '1px dashed #000', margin: '15px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '14px' }}><span>Starting Float:</span><span>₱ {shiftStats.startingCash.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '14px' }}><span>Cash Sales:</span><span>+ ₱ {shiftStats.cashSales.toFixed(2)}</span></div>
              {shiftStats.cashDrops > 0 && (
                 <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '14px' }}><span>Cash Dropped (Skim):</span><span>- ₱ {shiftStats.cashDrops.toFixed(2)}</span></div>
              )}
              <div style={{ borderBottom: '1px dashed #000', margin: '15px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: '16px', fontWeight: 'bold' }}><span>EXPECTED CASH:</span><span>₱ {shiftStats.expectedCash.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: '16px', fontWeight: 'bold' }}><span>ACTUAL COUNT:</span><span>₱ {shiftStats.actualCash.toFixed(2)}</span></div>
              <div style={{ borderBottom: '1px dashed #000', margin: '15px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
                 <span>{shiftStats.shortage < 0 ? 'SHORTAGE:' : (shiftStats.shortage > 0 ? 'OVERAGE:' : 'BALANCED:')}</span>
                 <span>₱ {Math.abs(shiftStats.shortage).toFixed(2)}</span>
              </div>
              <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '12px' }}>End of Report</div>
            </div>
         </div>
         <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={handlePrintZReading} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '2px solid #3B2213', backgroundColor: '#fff', color: '#3B2213', fontWeight: '900', cursor: 'pointer', fontSize: '15px' }}>🖨️ Print Receipt</button>
            <button onClick={finalizeShiftAndLogout} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#3B2213', color: '#fff', fontWeight: '900', cursor: 'pointer', fontSize: '15px' }}>Lock Terminal</button>
         </div>
      </div>
    </div>
  );
}