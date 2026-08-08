import { createReadStream, existsSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

// Relative base: one dist works at the publish port and under /{backend}/frontend-typescript-jquery/.
const mountBase = './';

/** `${UI_RUNTIME}` overlay — the Docker image copies it over `dist/`. */
const overlayRoot = resolve(__dirname, '../../_shared/frontend-javascript-app');

const OVERLAY_CONTENT_TYPE: Record<string, string> = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
};

type Middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

function insideDir(dir: string, candidate: string): boolean {
  return candidate === dir || candidate.startsWith(`${dir}/`);
}

function pathnameOf(url: string): string {
  const queryAt = url.indexOf('?');
  return queryAt === -1 ? url : url.slice(0, queryAt);
}

/**
 * Dev and preview only: serve the design-system runtime (`js/header.js` and the
 * markup templates it fetches) straight from `frontend/_shared`. In the container
 * those paths come from the `${UI_RUNTIME}` overlay, so they are never bundled.
 */
function overlayRuntime(): Plugin {
  const serveOverlay: Middleware = (req, res, next) => {
    const pathname = pathnameOf(req.url ?? '/');
    if (!/^\/(js|templates)\//.test(pathname)) {
      next();
      return;
    }
    const file = resolve(join(overlayRoot, pathname));
    if (!insideDir(overlayRoot, file) || !existsSync(file) || !statSync(file).isFile()) {
      next();
      return;
    }
    res.setHeader('Content-Type', OVERLAY_CONTENT_TYPE[extname(file)] ?? 'application/octet-stream');
    createReadStream(file).pipe(res);
  };

  return {
    name: 'overlay-runtime',
    configureServer(server) {
      server.middlewares.use(serveOverlay);
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveOverlay);
    },
  };
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
  plugins: [extensionlessHtml(), overlayRuntime()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
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
