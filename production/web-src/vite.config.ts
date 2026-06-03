import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Build ra ../web để Nginx (docker-compose) phục vụ tĩnh.
// Dev: proxy /api và /media sang API NestJS (cổng 3000).
// Tắt PWA khi build dưới subpath (VITE_PWA=off) để tránh lệch scope service worker.
const pwa = process.env.VITE_PWA !== 'off';

export default defineConfig({
  plugins: [
    react(),
    ...(pwa ? [VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'BK360 – Hành trình 70 năm',
        short_name: 'BK360',
        description: 'Tham quan ảo 360° Đại học Bách khoa Hà Nội',
        theme_color: '#9e1b32',
        background_color: '#0b1726',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'bk360-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 60, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/media/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'bk360-media',
              expiration: { maxEntries: 300, maxAgeSeconds: 2592000 },
            },
          },
        ],
      },
    })] : []),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/media': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../web',
    emptyOutDir: true,
  },
});
