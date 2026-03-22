import React, { useEffect } from 'react';

export default function LandingPage({ onLoginClick }) {
  useEffect(() => {
    // Total wait time is 5 seconds.
    // The high-speed zoom starts at 3.5 seconds.
    const timer = setTimeout(() => {
      onLoginClick();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onLoginClick]);

  return (
    <div className="splash-screen" style={{ 
      backgroundColor: '#FDFBF7', 
      height: '100vh', 
      width: '100vw',
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      
      <div className="zoom-wrapper" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        width: '100%',
        padding: '0 20px',
        boxSizing: 'border-box',
        marginTop: '-10vh',
        animation: 'ultraSmoothZoom 1.5s cubic-bezier(0.7, 0, 0.84, 0) 3.5s forwards'
      }}>
        
        <img 
          src={`${import.meta.env.BASE_URL}images/TallyBrewLogo.png`} 
          alt="TallyBrew Logo" 
          className="main-splash-logo"
          style={{ 
            height: 'auto', 
            position: 'relative', 
            zIndex: 1 
          }}
        />
        
        <div className="loading-container" style={{ 
          position: 'relative', 
          zIndex: 10, 
          width: '80%', 
          maxWidth: '350px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 'var(--logo-overlap)', // Dynamic "tuck"
          animation: 'smoothFadeOut 0.4s ease-out 3.5s forwards' 
        }}>
          <div className="loading-bar-background" style={{ 
            width: '100%', 
            height: '10px', 
            backgroundColor: '#E6D0A9', 
            borderRadius: '10px', 
            overflow: 'hidden',
            marginBottom: '15px'
          }}>
            <div className="loading-bar-fill"></div>
          </div>
          <p className="loading-text" style={{
            margin: 0,
            color: '#3B2213',
            fontSize: '13px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}>
            Brewing your dashboard...
          </p>
        </div>
      </div>

      <style>{`
        /* RESPONSIVE OVERLAP ENGINE */
        :root {
          --logo-overlap: -15%; /* Perfect for mobile */
        }

        .main-splash-logo {
          width: 90%;
          max-width: 600px;
        }

        /* iPad / Tablet */
        @media (min-width: 768px) {
          :root { --logo-overlap: -90px; }
          .main-splash-logo { width: 70%; }
        }

        /* Desktop original overlap */
        @media (min-width: 1024px) {
          :root { --logo-overlap: -120px; }
          .main-splash-logo { width: 100%; }
        }

        /* ANIMATIONS */
        @keyframes loadFill {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        @keyframes ultraSmoothZoom {
          0% { transform: scale(1); filter: blur(0px); opacity: 1; }
          100% { transform: scale(25); filter: blur(20px); opacity: 0; }
        }

        @keyframes smoothFadeOut {
          to { opacity: 0; transform: translateY(15px); }
        }

        .loading-bar-fill {
          height: 100%;
          background-color: #B56124;
          border-radius: 10px;
          animation: loadFill 3.5s linear forwards;
        }

        .zoom-wrapper {
          animation: initialFadeIn 1.2s ease-out forwards;
        }

        @keyframes initialFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}