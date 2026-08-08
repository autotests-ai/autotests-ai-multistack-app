import { createReadStream, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * The `${UI_RUNTIME}` overlay (design-system CSS, `js/header.js` + its header
 * template) is copied next to the built app by the Dockerfile, so the pages
 * reference those files instead of bundling them. Vite has nothing to serve
 * them from during `dev`/`preview`, so stream them straight off the overlay —
 * otherwise the header never mounts and the app renders unstyled.
 */
const OVERLAY_ROOT = resolve(__dirname, '../../_shared/frontend-javascript-app');
const OVERLAY_PATH_RE = /^\/((?:css|js|templates)\/[\w.-]+)$/;
const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function serveOverlayFile(
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
): void {
  const [path] = (req.url ?? '').split('?');
  const match = OVERLAY_PATH_RE.exec(path);
  if (!match) {
    next();
    return;
  }
  const file = join(OVERLAY_ROOT, match[1]);
  const inOverlay = file.startsWith(`${OVERLAY_ROOT}/`);
  if (!inOverlay || !statSync(file, { throwIfNoEntry: false })?.isFile()) {
    next();
    return;
  }
  res.setHeader('Content-Type', MIME_TYPES[extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(res);
}

/**
 * Installed ahead of Vite's own handlers — the preview server would otherwise
 * answer every overlay path with `index.html`. Product CSS is unaffected: the
 * overlay owns no `app/auth/grid/page/text.css`, so those fall through to
 * `public/`.
 */
function overlayRuntime(): Plugin {
  return {
    name: 'overlay-runtime',
    configureServer(server) {
      server.middlewares.use(serveOverlayFile);
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveOverlayFile);
    },
  };
}

export default defineConfig({
  root: resolve(__dirname),
  // Relative base: one dist is served under every `/{backend}/{frontend}/` prefix.
  base: './',
  server: { port: 9810, strictPort: true },
  preview: { port: 9810, strictPort: true },
  plugins: [overlayRuntime()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
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
        // Everything the three pages share (appBase, auth, api, messages,
        // header) in one named chunk, rather than a name Rollup picks for us.
        manualChunks(id) {
          return /\/src\/(?!home\.ts|login\.ts|register\.ts)[^/]+\.ts$/.test(id)
            ? 'shared'
            : undefined;
        },
      },
    },
  },
});
