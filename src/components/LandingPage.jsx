import React, { useEffect } from 'react';

export default function LandingPage({ onLoginClick }) {
 useEffect(() => {
   
    const imagesToPreload = [
      `${import.meta.env.BASE_URL}images/TallyBrewLogo.png`,
     
    ];

    imagesToPreload.forEach((imageSrc) => {
      const img = new Image();
      img.src = imageSrc;
    });

   
    const timer = setTimeout(() => {
      onLoginClick();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onLoginClick]);

  return (
    <div className="original-splash">
      <div className="splash-center">
        
        <img 
          src={`${import.meta.env.BASE_URL}images/TallyBrewLogo.png`} 
          alt="TallyBrew Logo" 
          className="original-logo"
        />
        
        <div className="loading-section">
          <div className="bar-bg">
            <div className="bar-fill"></div>
          </div>
          <p className="bar-text">Brewing your dashboard...</p>
        </div>

      </div>

      <style>{`
        .original-splash {
          background-color: #FDFBF7;
          height: 100vh;
          width: 100vw;
          display: flex;
          justify-content: center;
          align-items: center;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
        }

        .splash-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 800px; 
          padding: 0 20px;
          box-sizing: border-box;
          /* FIX: Aggressively lifted the entire container up to find the true visual center */
          margin-top: -22vh; 
          animation: fadeIn 1s ease-out;
        }

        .original-logo {
          width: 95%; 
          max-width: 750px; 
          height: auto;
          position: relative;
          z-index: 1;
          margin-bottom: -26%; 
        }

        @media (min-width: 768px) {
          .original-logo { 
            margin-bottom: -140px; 
            width: 85%; 
          } 
        }

        @media (min-width: 1024px) {
          .original-logo { 
            margin-bottom: -200px; 
            width: 100%; 
            max-width: 750px; 
          } 
        }

        .loading-section {
          position: relative;
          z-index: 10;
          width: 85%;
          max-width: 340px; 
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .bar-bg {
          width: 100%;
          height: 12px; 
          background-color: #E8E1D7; 
          border-radius: 20px; 
          overflow: hidden;
          margin-bottom: 14px; 
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.05); 
        }

        .bar-fill {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #6b3615 0%, #d97706 100%); 
          border-radius: 20px;
          animation: originalLoad 5s linear forwards;
        }

        .bar-text {
          margin: 0;
          color: #8C7A6B; 
          font-size: 12px; 
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 3px; 
          text-align: center;
        }

        /* Animations */
        @keyframes originalLoad {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
