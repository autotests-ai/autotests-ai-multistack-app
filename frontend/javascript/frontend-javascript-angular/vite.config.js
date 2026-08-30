import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { angularDecorators } from './babel-decorators.js';
import { overlayRuntime } from './scripts/vite-overlay-runtime.mjs';

const moduleDir = dirname(fileURLToPath(import.meta.url));

// Relative base: one dist works under /{backend}/frontend-javascript-angular/
const mountBase = './';

/** Move Vite-injected ./assets/* tags into the boot document.write (absolute mount). */
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
  root: moduleDir,
  base: mountBase,
  server: {
    port: 9802,
    strictPort: true,
    fs: {
      allow: [moduleDir],
    },
  },
  preview: { port: 9802, strictPort: true },
  plugins: [overlayRuntime(resolve(moduleDir, 'vendor/ds')), angularDecorators(), pinMountAssets()],
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
