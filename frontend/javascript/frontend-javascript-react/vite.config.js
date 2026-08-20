import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const reactUiSrc = resolve(__dirname, '../../_shared/frontend-react-ui/src/index.ts');
// Relative base: one dist works under /{backend}/frontend-javascript-react/
const mountBase = './';

/**
 * Move Vite-injected ./assets/* tags into the boot document.write (absolute mount).
 *
 * @returns {import('vite').Plugin}
 */
function pinMountAssets() {
  return {
    name: 'pin-mount-assets',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const writes = [];
        let next = html.replace(
          /<script type="module" crossorigin src="\.\/(assets\/[^"]+)"><\/script>\s*/g,
          (_m, path) => {
            writes.push(
              `document.write('<script type="module" crossorigin src="'+mount+'${path}"><\\/script>');`,
            );
            return '';
          },
        );
        next = next.replace(
          /<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+)">\s*/g,
          (_m, path) => {
            writes.push(
              `document.write('<link rel="stylesheet" crossorigin href="'+mount+'${path}">');`,
            );
            return '';
          },
        );
        next = next.replace(
          /<link rel="manifest" href="\.\/(manifest\.webmanifest)">\s*/g,
          (_m, path) => {
            writes.push(`document.write('<link rel="manifest" href="'+mount+'${path}">');`);
            return '';
          },
        );
        if (!writes.length) {
          return next;
        }
        if (!next.includes('// __PIN_ASSETS__')) {
          throw new Error('pin-mount-assets: boot marker // __PIN_ASSETS__ missing in index.html');
        }
        return next.replace(/\/\/ __PIN_ASSETS__[^\n]*/, writes.join('\n      '));
      },
    },
  };
}

export default defineConfig({
  root: resolve(__dirname),
  base: mountBase,
  server: { port: 9801, strictPort: true },
  preview: { port: 9801, strictPort: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      manifest: {
        name: 'Multistack',
        short_name: 'Multistack',
        description: 'autotests-ai-multistack-app — JavaScript React SPA',
        start_url: mountBase,
        scope: mountBase,
        display: 'standalone',
        theme_color: '#151414',
        background_color: '#151414',
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
        // Never SPA-fallback real assets (else nested route asset paths → text/html MIME errors).
        navigateFallbackDenylist: [
          /\/api\//,
          /\.(?:css|js|mjs|map|png|svg|ico|webmanifest|json|woff2?)$/i,
        ],
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
    // After VitePWA so manifest link is rewritten too.
    pinMountAssets(),
  ],
  resolve: {
    // The library alias points outside this package, so its `react` import would
    // otherwise resolve against a copy hoisted higher in the tree — two Reacts in
    // one render tree, which fails as "Invalid hook call".
    dedupe: ['react', 'react-dom'],
    alias: {
      '@zero-design-system/react': reactUiSrc,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rolldownOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
