import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifestFilename: 'manifest.json',
      // Without these, a new deploy's service worker sits in "waiting" until every
      // open tab of the old version is closed, so returning visitors (and we,
      // testing right after a deploy) keep getting served the stale cached build.
      // skipWaiting + clientsClaim make the new worker take over immediately.
      workbox: {
        skipWaiting: true,
        clientsClaim: true
      },
      manifest: {
        name: 'GiGO for You',
        short_name: 'GiGO',
        description: 'GiGO for You Web Application',
        theme_color: '#863bff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      }
    })
  ],
})
