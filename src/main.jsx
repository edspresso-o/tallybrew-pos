import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx' 
import { AuthProvider } from './context/AuthContext.jsx' // <-- 1. Import your new Vault here!
import './index.css'

// Import the offline PWA function
import { registerSW } from 'virtual:pwa-register'

// Start the offline caching robot!
registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* The safety net catches everything inside it */}
    <ErrorBoundary>
      {/* 2. Wrap the AuthProvider exactly here, around the App */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)