import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { overlayRuntime } from './scripts/vite-overlay-runtime.mjs';

export default defineConfig({
  root: resolve(__dirname),
  // Relative base: one dist is served under every `/{backend}/{frontend}/` prefix.
  base: './',
  server: { port: 9810, strictPort: true },
  preview: { port: 9810, strictPort: true },
  plugins: [overlayRuntime(resolve(__dirname, 'vendor/ds'), { css: true })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rolldownOptions: {
      // Multi-page app: three real HTML documents, no client-side router.
      input: {
        index: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
        codeSplitting: {
          // Everything the three pages share (appBase, auth, api, messages,
          // header) in one named chunk, rather than a name the bundler picks.
          groups: [
            { name: 'shared', test: /\/src\/(?!home\.ts|login\.ts|register\.ts)[^/]+\.ts$/ },
          ],
        },
      },
    },
  },
});
