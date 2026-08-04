import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';

const reactUiSrc = resolve(__dirname, '../../_shared/frontend-react-ui/src/index.ts');
const mountBase = '/frontend-typescript-react/';

export default defineConfig({
  root: resolve(__dirname),
  base: mountBase,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      manifest: {
        name: 'Reference App',
        short_name: 'Reference',
        description: 'Reference application — Spring Boot + React SPA pilot',
        start_url: mountBase,
        scope: mountBase,
        display: 'standalone',
        theme_color: '#2c2a26',
        background_color: '#2c2a26',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: [
          'index.html',
          'assets/index.js',
          'assets/index.css',
          'manifest.webmanifest',
          'icons/pwa-192.png',
          'icons/pwa-512.png',
          'icons/pwa-maskable-512.png',
        ],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@zero-design-system/react': reactUiSrc,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
