import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Aim Dental CRM',
        short_name: 'Aim CRM',
        description: 'Aim Dental Lab CRM — leads, clients, and case pickup management.',
        start_url: '/dashboard',
        scope: '/',
        display: 'standalone',
        background_color: '#0b1220',
        theme_color: '#06babe',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Data must always come from the network — only the app shell (built
        // JS/CSS/fonts/icons) is precached, so cached UI never serves stale
        // leads/clients or masks a role change after login.
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
