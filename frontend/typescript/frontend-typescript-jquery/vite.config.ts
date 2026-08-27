import { existsSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { overlayRuntime } from '../../scripts/vite-overlay-runtime.mjs';

// Relative base: one dist works at the publish port and under /{backend}/frontend-typescript-jquery/.
const mountBase = './';

type Middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

function insideDir(dir: string, candidate: string): boolean {
  return candidate === dir || candidate.startsWith(`${dir}/`);
}

function pathnameOf(url: string): string {
  const queryAt = url.indexOf('?');
  return queryAt === -1 ? url : url.slice(0, queryAt);
}

/**
 * Dev and preview mirror of the module's nginx `try_files $uri $uri.html`:
 * the app links to `/login`, the document on disk is `login.html`.
 */
function extensionlessHtml(): Plugin {
  let devDir = '';
  let previewDir = '';

  const rewriteInto =
    (dir: () => string): Middleware =>
    (req, _res, next) => {
      const url = req.url ?? '/';
      const pathname = pathnameOf(url);
      const document = resolve(join(dir(), `${pathname}.html`));
      if (pathname !== '/' && !extname(pathname) && insideDir(dir(), document) && existsSync(document)) {
        req.url = `${pathname}.html${url.slice(pathname.length)}`;
      }
      next();
    };

  return {
    name: 'extensionless-html',
    configResolved(config) {
      devDir = config.root;
      previewDir = resolve(config.root, config.build.outDir);
    },
    configureServer(server) {
      server.middlewares.use(rewriteInto(() => devDir));
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewriteInto(() => previewDir));
    },
  };
}

export default defineConfig({
  root: resolve(__dirname),
  base: mountBase,
  // Real documents per screen — no SPA fallback to index.html.
  appType: 'mpa',
  server: { port: 9814, strictPort: true },
  preview: { port: 9814, strictPort: true },
  plugins: [extensionlessHtml(), overlayRuntime(resolve(__dirname, 'vendor/ds'))],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rolldownOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
