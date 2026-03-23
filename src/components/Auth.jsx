import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SECRET_KEY = "TallyBrew@2026_SecureVault_X99!";

const encryptData = (data) => {
  const text = JSON.stringify(data); let result = '';
  for (let i = 0; i < text.length; i++) result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  return btoa(result); 
};

const decryptData = (encryptedData) => {
  try {
    const text = atob(encryptedData); let result = '';
    for (let i = 0; i < text.length; i++) result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    return JSON.parse(result);
  } catch (e) { return null; }
};

export default function Auth({ isRecovering, onRecoveryComplete }) {
  const [isLogin, setIsLogin] = useState(!isRecovering);
  const [isResetting, setIsResetting] = useState(false); 
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(isRecovering || false);
  const [loading, setLoading] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false); 
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(localStorage.getItem('tallybrew_branch') || '');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('cashier'); 
  const [terminalPin, setTerminalPin] = useState(''); 
  const [otpCode, setOtpCode] = useState(''); 
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchBranches = async () => {
      // OFFLINE ENHANCEMENT: Allow login even if we can't fetch branches
      if (!navigator.onLine) return;
      const { data } = await supabase.from('branches').select('*');
      if (data) setBranches(data);
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsUpdatingPassword(true);
        setIsResetting(false);
        setIsLogin(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleBranchChange = (e) => {
    const branchId = e.target.value;
    setSelectedBranch(branchId);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!navigator.onLine) return setError("You must be online to reset your password.");
    setLoading(true); setError(''); setSuccessMsg('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, 
      });
      if (resetError) throw resetError;
      setSuccessMsg("Reset link sent! Please check your email inbox.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!navigator.onLine) return setError("You must be online to update your password.");
    setLoading(true); setError(''); setSuccessMsg('');

    try {
      if (newPassword.length < 6) throw new Error("Password must be at least 6 characters.");
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      
      setSuccessMsg("Password updated successfully! Logging you in...");
      setNewPassword('');
      
      setTimeout(() => {
        if (onRecoveryComplete) onRecoveryComplete();
        else window.location.reload();
      }, 1500);

    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');

    try {
      if (!selectedBranch && !isRecovering && navigator.onLine) throw new Error("Please select a Store Location first.");

      if (isLogin) {
        
        // --- SECURE OFFLINE VAULT LOGIC ---
        if (!navigator.onLine) {
          const vaultData = localStorage.getItem('tb_offline_vault');
          if (vaultData) {
            const vault = decryptData(vaultData);
            if (vault && vault.email === email && vault.password === password) {
              if (selectedBranch && vault.branch_id !== selectedBranch) throw new Error("Credentials match, but not for this location.");
              
              localStorage.setItem('tallybrew_branch', vault.branch_id);
              localStorage.setItem('tb_offline_session', 'true'); // Flag to tell App.jsx we are allowed in
              setSuccessMsg("Offline Vault Unlocked! Logging you in...");
              setTimeout(() => window.location.reload(), 1000);
              return;
            }
          }
          throw new Error("No internet connection and no offline vault matches these credentials.");
        }
        // ----------------------------------

        // NORMAL ONLINE LOGIC
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        
        const userBranch = data.user?.user_metadata?.branch_id;

        if (userBranch && userBranch !== selectedBranch) {
          await supabase.auth.signOut(); 
          let intendedLocation = "another location";
          if (userBranch === 'admin_remote') {
            intendedLocation = "💻 Remote Admin (Dashboard Only)";
          } else {
            const correctBranch = branches.find(b => b.id === userBranch);
            if (correctBranch) intendedLocation = correctBranch.name;
          }
          throw new Error(`Access Denied: This email is strictly locked to ${intendedLocation}.`);
        }

        // SAVE SUCCESSFUL LOGIN TO OFFLINE VAULT
        localStorage.setItem('tallybrew_branch', selectedBranch);
        localStorage.setItem('tb_offline_vault', encryptData({ email, password, branch_id: selectedBranch }));
        localStorage.setItem('tb_offline_session', 'true');
        
        window.location.reload(); 

      } else {
        if (!navigator.onLine) throw new Error("You must be online to create an account.");
        if (!username) throw new Error("Please enter a display name.");
        if (terminalPin.length !== 6) throw new Error("Your Terminal PIN must be exactly 6 digits.");
        
        const { error: signUpError } = await supabase.auth.signUp({ 
          email, password, options: { data: { branch_id: selectedBranch } }
        });
        
        if (signUpError) throw signUpError;

        setSuccessMsg("We sent a 6-digit verification code to your email!");
        setAwaitingOtp(true); 
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!navigator.onLine) return setError("You must be online to verify an account.");
    setLoading(true); setError('');

    try {
      if (otpCode.length !== 6) throw new Error("The verification code must be exactly 6 digits.");

      const { data, error: verifyError } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'signup' });
      if (verifyError) throw verifyError;

      if (data?.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          { username: username, role: role, pin: terminalPin, branch_id: selectedBranch }
        ]);
        if (profileError) throw profileError;
      }

      setSuccessMsg("Account verified! You are now logged in.");
      localStorage.setItem('tallybrew_branch', selectedBranch);
      localStorage.setItem('tb_offline_vault', encryptData({ email, password, branch_id: selectedBranch }));
      localStorage.setItem('tb_offline_session', 'true');
      
      window.location.reload();

    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#FDFBF7', fontFamily: "'Inter', sans-serif", padding: '20px', boxSizing: 'border-box' }}>
      
     <img 
        src={`${import.meta.env.BASE_URL}images/TallyBrewPosLogo.png`} 
        alt="TallyBrew Logo" 
        style={{ width: '100%', maxWidth: '300px', maxHeight: '150px', objectFit: 'contain', marginBottom: '20px' }} 
      />

      <div style={{ background: '#E6D0A9', borderRadius: '24px', padding: '30px', width: '100%', maxWidth: isLogin ? '360px' : '460px', boxShadow: '0 15px 35px rgba(0,0,0,0.06)', animation: 'fadeIn 0.3s ease-out', boxSizing: 'border-box', transition: 'max-width 0.3s ease' }}>
        
        <h2 style={{ color: '#B56124', fontSize: '26px', fontWeight: '800', margin: '0 0 20px 0', letterSpacing: '-0.5px' }}>
          {isUpdatingPassword ? 'New Password' : isResetting ? 'Reset Password' : (awaitingOtp ? 'Verify Email' : (isLogin ? 'Welcome Back' : 'Sign Up'))}
        </h2>

        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '12px', marginBottom: '15px', fontSize: '13px', fontWeight: '600', border: '1px solid #fecaca' }}>{error}</div>}
        {successMsg && <div style={{ background: '#ecfdf5', color: '#059669', padding: '12px', borderRadius: '12px', marginBottom: '15px', fontSize: '13px', fontWeight: '600', border: '1px solid #a7f3d0' }}>{successMsg}</div>}

        {isUpdatingPassword ? (
          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
             <p style={{ color: '#3B2213', fontSize: '14px', fontWeight: '600', marginBottom: '5px', opacity: 0.8 }}>Enter your new secure password below.</p>
             <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} required autoFocus />
             <button type="submit" disabled={loading || newPassword.length < 6} style={btnStyle(loading || newPassword.length < 6)}>
               {loading ? 'Saving...' : 'Save New Password'}
             </button>
          </form>

        ) : isResetting ? (
          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
             <p style={{ color: '#3B2213', fontSize: '14px', fontWeight: '600', marginBottom: '5px', opacity: 0.8 }}>Enter your email address to receive a reset link.</p>
             <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
             <button type="submit" disabled={loading} style={btnStyle(loading)}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
             <p onClick={() => { setIsResetting(false); setError(''); setSuccessMsg(''); }} style={{ textAlign: 'center', marginTop: '10px', color: '#B56124', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>← Back to Login</p>
          </form>

        ) : awaitingOtp ? (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <p style={{ color: '#3B2213', fontSize: '14px', fontWeight: '600', margin: '0 0 10px 0', opacity: 0.8 }}>
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>

            <input 
              type="text" 
              placeholder="• • • • • •" 
              value={otpCode} 
              maxLength={6} 
              onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))} 
              style={{...inputStyle, fontSize: '24px', letterSpacing: '8px', textAlign: 'center', fontWeight: '800'}} 
              required 
              autoFocus
            />

            <button type="submit" disabled={loading || otpCode.length !== 6} style={btnStyle(loading || otpCode.length !== 6)}>
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>
            
            <p onClick={() => { setAwaitingOtp(false); setOtpCode(''); setError(''); setSuccessMsg(''); }} style={{ textAlign: 'center', margin: '15px 0 0 0', color: '#B56124', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              ← Back to Sign Up
            </p>
          </form>

        ) : (
          
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div style={{ position: 'relative' }}>
              <select 
                value={selectedBranch} 
                onChange={handleBranchChange} 
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', border: '2px solid #B56124', width: '100%', boxSizing: 'border-box' }} 
                required={navigator.onLine}
              >
                <option value="" disabled>Select Store Location</option>
                <option value="admin_remote">Remote Admin</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {!isLogin ? (
              <>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" placeholder="Display Name" value={username} onChange={(e) => setUsername(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} required />
                  <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0, appearance: 'none', cursor: 'pointer' }}>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager (Admin)</option>
                  </select>
                </div>
                
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} required />

                  <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                    <input 
                      type="password" 
                      placeholder="6-Digit PIN" 
                      value={terminalPin} 
                      maxLength={6} 
                      onChange={(e) => setTerminalPin(e.target.value.replace(/[^0-9]/g, ''))} 
                      style={{...inputStyle, letterSpacing: '2px', width: '100%', boxSizing: 'border-box', paddingRight: '70px'}} 
                      required 
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '15px', fontSize: '10px', color: '#B56124', fontWeight: '900', textTransform: 'uppercase' }}>
                      POS Lock
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />

                <div style={{ width: '100%', textAlign: 'right', marginTop: '-5px' }}>
                  <span onClick={() => { setIsResetting(true); setError(''); setSuccessMsg(''); }} style={{ fontSize: '12px', color: '#B56124', fontWeight: '800', cursor: 'pointer' }}>
                    Forgot Password?
                  </span>
                </div>
              </>
            )}

            <button type="submit" disabled={loading} style={btnStyle(loading)}>
              {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
            </button>
          </form>
        )}

        {!awaitingOtp && !isResetting && !isUpdatingPassword && (
          <p onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ textAlign: 'center', margin: '20px 0 0 0', color: '#3B2213', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }} onMouseOver={(e) => e.target.style.opacity = 0.7} onMouseOut={(e) => e.target.style.opacity = 1}>
            {isLogin ? "Don't have an account? Sign Up" : "Already setup? Log In"}
          </p>
        )}

      </div>
    </div>
  );
}

const inputStyle = { background: '#F5E8D2', border: 'none', borderRadius: '12px', padding: '14px 18px', fontSize: '14px', fontWeight: '600', color: '#3B2213', outline: 'none', width: '100%', boxSizing: 'border-box' };
const btnStyle = (disabled) => ({ background: '#3B2213', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: disabled ? 'not-allowed' : 'pointer', marginTop: '5px', transition: '0.2s', opacity: disabled ? 0.7 : 1, width: '100%', boxSizing: 'border-box' });