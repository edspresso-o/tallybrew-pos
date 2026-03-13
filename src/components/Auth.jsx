import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false); // Controls showing the OTP screen
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('cashier'); 
  const [terminalPin, setTerminalPin] = useState(''); // The 6-digit code for the POS Lock Screen
  const [otpCode, setOtpCode] = useState(''); // The 6-digit code sent to their EMAIL
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- STEP 1: LOGIN OR SIGN UP ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        // LOGIN
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
      } else {
        // SIGN UP
        if (!username) throw new Error("Please enter a display name.");
        if (terminalPin.length !== 6) throw new Error("Your Terminal PIN must be exactly 6 digits.");
        
        // Register the user with Email and Password
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        
        if (signUpError) throw signUpError;

        // Trigger the OTP UI
        setSuccessMsg("We sent a 6-digit verification code to your email!");
        setAwaitingOtp(true); 
      }
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- STEP 2: VERIFY EMAIL OTP (Only for Sign Up) ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (otpCode.length !== 6) throw new Error("The verification code must be exactly 6 digits.");

      // Verify the OTP code with Supabase
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup' // Tells Supabase this is an email confirmation code
      });

      if (verifyError) throw verifyError;

      // Once verified, save their Name, Role, and POS Terminal PIN to your database!
      if (data?.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          { username: username, role: role, pin: terminalPin }
        ]);
        if (profileError) throw profileError;
      }

      setSuccessMsg("Account verified! You are now logged in.");
      // App.jsx will automatically detect the active session and load the POS.

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

        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
        {successMsg && <div style={{ background: '#ecfdf5', color: '#059669', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', fontWeight: '600' }}>{successMsg}</div>}

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