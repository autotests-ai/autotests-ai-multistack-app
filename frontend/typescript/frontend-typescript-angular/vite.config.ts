import { defineConfig, type Plugin } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'node:path';

// Relative base: one dist works under /{backend}/frontend-typescript-angular/
const mountBase = './';

/** Move Vite-injected ./assets/* tags into the boot document.write (absolute mount). */
function pinMountAssets(): Plugin {
  return {
    name: 'pin-mount-assets',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const writes: string[] = [];
        let next = html.replace(
          /<script type="module" crossorigin src="\.\/(assets\/[^"]+)"><\/script>\s*/g,
          (_m, path: string) => {
            writes.push(
              `document.write('<script type="module" crossorigin src="'+mount+'${path}"><\\/script>');`,
            );
            return '';
          },
        );
        next = next.replace(
          /<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+)">\s*/g,
          (_m, path: string) => {
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

/**
 * Analog's production optimizer defines `ngDevMode: false` and strips
 * `ɵsetClassDebugInfo`, so Angular DevTools treats the nginx image as prod.
 * Drop that plugin and keep `ngDevMode` so the catalog (stage/prod) is inspectable.
 */
function analogForDevTools(): Plugin[] {
  return angular({ tsconfig: resolve(__dirname, 'tsconfig.json') }).filter(
    (plugin) => plugin.name !== '@analogjs/vite-plugin-angular-optimizer',
  );
}

export default defineConfig({
  root: resolve(__dirname),
  base: mountBase,
  server: { port: 9812, strictPort: true },
  preview: { port: 9812, strictPort: true },
  define: {
    ngDevMode: 'true',
  },
  // Single tsconfig for app + tests, so point the Angular compiler at it
  // (the plugin otherwise looks for the CLI's tsconfig.app.json).
  plugins: [...analogForDevTools(), pinMountAssets()],
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
