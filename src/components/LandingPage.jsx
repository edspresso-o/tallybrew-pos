import React, { useEffect } from 'react';

export default function LandingPage({ onLoginClick }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onLoginClick();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onLoginClick]);

  return (
    <div className="splash-screen">
      {/* 1. We added marginTop: '-15vh' here to pull the whole block up toward the top of the screen */}
      <div className="splash-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-15vh' }}>
        
        {/* 2. Increased maxWidth to 600px (bigger) */}
        {/* 3. Changed marginBottom to -120px (even closer together) */}
        <img 
          src={`${import.meta.env.BASE_URL}images/TallyBrewLogo.png`} 
          alt="TallyBrew Logo" 
          style={{ maxWidth: '600px', width: '100%', height: 'auto', marginBottom: '-120px' }}
        />
        
        {/* The loading bar stays locked on top of the blue space */}
        <div className="loading-container" style={{ position: 'relative', zIndex: 10 }}>
          <div className="loading-bar-background">
            <div className="loading-bar-fill"></div>
          </div>
          <p className="loading-text">Brewing your dashboard...</p>
        </div>
      </div>
    </div>
  );
}