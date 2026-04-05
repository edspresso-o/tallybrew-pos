import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function SettingsLocations() {
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  const [branchStatusMsg, setBranchStatusMsg] = useState('');
  const [isBranchError, setIsBranchError] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoadingBranches(true);
    const { data } = await supabase.from('branches').select('*').order('name');
    if (data) setBranches(data);
    setLoadingBranches(false);
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!newBranchName.trim()) {
      setIsBranchError(true);
      setBranchStatusMsg("Branch Name is required.");
      return;
    }
    try {
      const { error } = await supabase.from('branches').insert([{ name: newBranchName, location: newBranchLocation }]);
      if (error) throw error;
      setIsBranchError(false);
      setBranchStatusMsg(`Success! ${newBranchName} is now live.`);
      setNewBranchName('');
      setNewBranchLocation('');
      fetchBranches(); 
      setTimeout(() => setBranchStatusMsg(''), 4000);
    } catch (err) {
      setIsBranchError(true);
      setBranchStatusMsg("Error: Could not add branch. Name might already exist.");
    }
  };

  return (
    <>
      {/* SAFER CSS INJECTIONS */}
      <style>{`
        .action-btn { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(181, 97, 36, 0.25) !important; }
        .action-btn:active:not(:disabled) { transform: translateY(0); }
        
        .branch-card { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .branch-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(59, 34, 19, 0.08); border-color: #B56124 !important; }

        .premium-input { width: 100%; padding: 16px 20px; box-sizing: border-box; background: #FDFBF7; border: 2px solid #E6D0A9; border-radius: 16px; font-size: 15px; font-weight: 700; color: #3B2213; outline: none; transition: all 0.2s; }
        .premium-input:focus { border-color: #B56124; box-shadow: 0 0 0 4px rgba(181, 97, 36, 0.1); }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', animation: 'fadeIn 0.3s ease-out', textAlign: 'left' }}>
        
        {/* LEFT COLUMN: ACTIVE BRANCHES */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(59, 34, 19, 0.04)', border: '1px solid #f3f4f6' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#FDFBF7', border: '1px solid #E6D0A9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#3B2213', margin: 0, letterSpacing: '-0.5px' }}>Active Branches</h2>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '25px', fontWeight: '500', paddingLeft: '52px' }}>All TallyBrew physical store locations.</p>
          
          {loadingBranches ? (
            <div style={{ padding: '30px 0', textAlign: 'center' }}>
              <p style={{ color: '#B56124', fontWeight: '800', fontSize: '15px', animation: 'pulse 1.5s infinite' }}>Loading locations...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {branches.map(branch => (
                <div key={branch.id} className="branch-card" style={{ display: 'flex', alignItems: 'center', padding: '20px', background: '#FDFBF7', borderRadius: '16px', border: '2px solid #E6D0A9', cursor: 'default' }}>
                  
                  <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: '#3B2213', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', flexShrink: 0, boxShadow: '0 4px 10px rgba(59, 34, 19, 0.2)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                  </div>
                  
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ color: '#3B2213', fontWeight: '900', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.3px' }}>
                      {branch.name}
                    </div>
                    <div style={{ color: '#B56124', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {branch.location || 'No address set'}
                    </div>
                  </div>
                </div>
              ))}
              
              {branches.length === 0 && (
                <div style={{ padding: '30px 20px', textAlign: 'center', background: '#FDFBF7', borderRadius: '16px', border: '2px dashed #E6D0A9' }}>
                  <p style={{ color: '#8B5E34', fontWeight: '700', margin: 0 }}>No branches registered yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: EXPAND EMPIRE FORM */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 30px rgba(59, 34, 19, 0.04)', border: '1px solid #f3f4f6', height: 'fit-content' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#FDFBF7', border: '1px solid #E6D0A9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B56124" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#3B2213', margin: 0, letterSpacing: '-0.5px' }}>Add New Branch</h2>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '25px', fontWeight: '500', paddingLeft: '52px' }}>Register a new store location to the database.</p>
          
          {branchStatusMsg && (
            <div style={{ background: isBranchError ? '#fef2f2' : '#ecfdf5', color: isBranchError ? '#dc2626' : '#059669', padding: '14px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', marginBottom: '25px', border: `1px solid ${isBranchError ? '#fecaca' : '#a7f3d0'}` }}>
              {branchStatusMsg}
            </div>
          )}
          
          <form onSubmit={handleAddBranch} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#B56124', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Branch Name
              </label>
              <input 
                type="text" 
                placeholder="e.g., TallyBrew - Annex" 
                value={newBranchName} 
                onChange={(e) => setNewBranchName(e.target.value)} 
                className="premium-input"
                required 
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#B56124', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Physical Location (Optional)
              </label>
              <input 
                type="text" 
                placeholder="e.g., North Mall, Ground Floor" 
                value={newBranchLocation} 
                onChange={(e) => setNewBranchLocation(e.target.value)} 
                className="premium-input"
              />
            </div>
            
            <button 
              type="submit" 
              className="action-btn"
              disabled={!newBranchName.trim()} 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '18px', borderRadius: '16px', border: 'none', background: '#B56124', color: '#fff', fontWeight: '900', fontSize: '15px', cursor: !newBranchName.trim() ? 'not-allowed' : 'pointer', opacity: !newBranchName.trim() ? 0.6 : 1, boxShadow: '0 8px 15px rgba(181, 97, 36, 0.2)', marginTop: '10px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add New Branch
            </button>
          </form>
        </div>
      </div>
    </>
  );
}