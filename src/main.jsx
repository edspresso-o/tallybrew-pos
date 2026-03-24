import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx' // 1. Import the safety net
import './index.css'

// Import the offline PWA function
import { registerSW } from 'virtual:pwa-register'

// Start the offline caching robot!
registerSW({ immediate: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. Wrap the app so if it crashes, the boundary catches it */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)