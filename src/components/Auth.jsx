import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false); 
  
  // --- Branch States ---
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(localStorage.getItem('tallybrew_branch') || '');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('cashier'); 
  const [terminalPin, setTerminalPin] = useState(''); 
  const [otpCode, setOtpCode] = useState(''); 
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Branches on Load
  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase.from('branches').select('*');
      if (data) setBranches(data);
    };
    fetchBranches();
  }, []);

  // Save Branch to Tablet Memory
  const handleBranchChange = (e) => {
    const branchId = e.target.value;
    setSelectedBranch(branchId);
  };

  // --- STEP 1: LOGIN OR SIGN UP ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (!selectedBranch) throw new Error("Please select a Store Location first.");

      if (isLogin) {
        // --- STRICT LOGIN LOGIC ---
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        
        // 1. Check the hidden metadata we saved during signup
        const userBranch = data.user?.user_metadata?.branch_id;

        // 2. Strict Bouncer: If the email doesn't match the selected dropdown, kick them out!
        if (userBranch && userBranch !== selectedBranch) {
          await supabase.auth.signOut(); // Log them back out immediately
          
          // Figure out the name of the branch they actually belong to for the error message
          let intendedLocation = "another location";
          if (userBranch === 'admin_remote') {
            intendedLocation = "💻 Remote Admin (Dashboard Only)";
          } else {
            const correctBranch = branches.find(b => b.id === userBranch);
            if (correctBranch) intendedLocation = correctBranch.name;
          }
          
          throw new Error(`Access Denied: This email is strictly locked to ${intendedLocation}.`);
        }

        // If they pass the check, allow the login
        localStorage.setItem('tallybrew_branch', selectedBranch);
        window.location.reload(); // Refresh to load the app

      } else {
        // --- STRICT SIGN UP LOGIC ---
        if (!username) throw new Error("Please enter a display name.");
        if (terminalPin.length !== 6) throw new Error("Your Terminal PIN must be exactly 6 digits.");
        
        const { error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              // We permanently brand this email to the selected branch
              branch_id: selectedBranch 
            }
          }
        });
        
        if (signUpError) throw signUpError;

        setSuccessMsg("We sent a 6-digit verification code to your email!");
        setAwaitingOtp(true); 
      }
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- STEP 2: VERIFY EMAIL OTP ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (otpCode.length !== 6) throw new Error("The verification code must be exactly 6 digits.");

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup' 
      });

      if (verifyError) throw verifyError;

      if (data?.user) {
        // Attach the branch_id to the user profile
        const { error: profileError } = await supabase.from('profiles').insert([
          { username: username, role: role, pin: terminalPin, branch_id: selectedBranch }
        ]);
        if (profileError) throw profileError;
      }

      setSuccessMsg("Account verified! You are now logged in.");
      localStorage.setItem('tallybrew_branch', selectedBranch);
      window.location.reload();

    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#FDFBF7', fontFamily: "'Inter', sans-serif" }}>
      
     <img 
        src={`${import.meta.env.BASE_URL}images/TallyBrewPosLogo.png`} 
        alt="TallyBrew Logo" 
        style={{ maxWidth: '300px', width: '100%', height: 'auto', marginBottom: '30px' }} 
      />

      <div style={{ background: '#E6D0A9', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '380px', boxShadow: '0 15px 35px rgba(0,0,0,0.06)', animation: 'fadeIn 0.3s ease-out' }}>
        
        <h2 style={{ color: '#B56124', fontSize: '28px', fontWeight: '800', margin: '0 0 25px 0', letterSpacing: '-0.5px' }}>
          {awaitingOtp ? 'Verify Email' : (isLogin ? 'Welcome Back' : 'Sign Up')}
        </h2>

        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', fontWeight: '600', border: '1px solid #fecaca' }}>{error}</div>}
        {successMsg && <div style={{ background: '#ecfdf5', color: '#059669', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', fontWeight: '600', border: '1px solid #a7f3d0' }}>{successMsg}</div>}

        {/* --- UI: OTP VERIFICATION SCREEN --- */}
        {awaitingOtp ? (
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
          
          /* --- UI: LOGIN / SIGN UP SCREEN --- */
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={{ position: 'relative' }}>
              <select 
                value={selectedBranch} 
                onChange={handleBranchChange} 
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', border: '2px solid #B56124', width: '100%', boxSizing: 'border-box' }} 
                required
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

            {!isLogin && (
              <>
                <input type="text" placeholder="Display Name" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} required />
                
                <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager (Admin)</option>
                </select>

                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    placeholder="Create 6-Digit PIN" 
                    value={terminalPin} 
                    maxLength={6} 
                    onChange={(e) => setTerminalPin(e.target.value.replace(/[^0-9]/g, ''))} 
                    style={{...inputStyle, letterSpacing: '2px', width: '100%', boxSizing: 'border-box'}} 
                    required 
                  />
                  <span style={{ position: 'absolute', right: '15px', top: '16px', fontSize: '11px', color: '#B56124', fontWeight: '800', textTransform: 'uppercase' }}>
                    POS Lock
                  </span>
                </div>
              </>
            )}

            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />

            <button type="submit" disabled={loading} style={btnStyle(loading)}>
              {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
            </button>
          </form>
        )}

        {/* --- TOGGLE LOGIN / SIGNUP --- */}
        {!awaitingOtp && (
          <p onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ textAlign: 'center', margin: '25px 0 0 0', color: '#3B2213', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }} onMouseOver={(e) => e.target.style.opacity = 0.7} onMouseOut={(e) => e.target.style.opacity = 1}>
            {isLogin ? "Don't have an account? Sign Up" : "Already setup? Log In"}
          </p>
        )}

      </div>
    </div>
  );
}

// Reusable Styles
const inputStyle = { background: '#F5E8D2', border: 'none', borderRadius: '12px', padding: '16px 20px', fontSize: '15px', fontWeight: '600', color: '#3B2213', outline: 'none' };
const btnStyle = (disabled) => ({ background: '#3B2213', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: disabled ? 'not-allowed' : 'pointer', marginTop: '10px', transition: '0.2s', opacity: disabled ? 0.7 : 1, width: '100%' });