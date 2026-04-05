import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/', // <-- THIS IS THE CRITICAL LINE FOR GITHUB PAGES!
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['images/TallyBrewPosLogo.png'], // Caches your logo for offline use!
      manifest: {
        name: 'TallyBrew POS',
        short_name: 'TallyBrew',
        description: 'TallyBrew Cafe Point of Sale System',
        theme_color: '#0a0a0a',
        background_color: '#FDFBF7',
        display: 'standalone', // This hides the browser URL bar so it looks like a real app!
        icons: [
          {
            src: 'images/TallyBrewPosLogo.png', 
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'images/TallyBrewPosLogo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // This tells the app to download EVERY code, styling, and image file to the hard drive!
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
})