// Dev/preview server for the static module. Mirrors the container: the module dir is
// layered over vendor/ds (design-system CSS + js/header.js), and lookup
// follows the nginx try_files chain, so extensionless /login and /register resolve here
// exactly like they do in prod. No bundler, no dependencies.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OVERLAY_ROOT = resolve(MODULE_ROOT, 'vendor/ds');
const ROOTS = [MODULE_ROOT, OVERLAY_ROOT];
const PORT = Number(process.env.PORT || 9804);

// Not part of the served root — same list the Dockerfile deletes after the copy.
const NOT_SERVED = [
  'Dockerfile',
  'README.md',
  'nginx.conf',
  'package.json',
  'package-lock.json',
  'vitest.config.js',
  'node_modules',
  'src',
  'scripts',
  'coverage',
  'vendor/ds',
];

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function findFile(urlPath) {
  const relative = urlPath.replace(/^\/+/, '');
  if (relative && NOT_SERVED.some((entry) => relative === entry || relative.startsWith(`${entry}/`))) {
    return null;
  }
  for (const root of ROOTS) {
    const candidate = resolve(root, relative);
    if (candidate !== root && !candidate.startsWith(root + sep)) continue;
    try {
      const stats = statSync(candidate);
      if (stats.isFile()) return candidate;
      if (stats.isDirectory()) {
        const index = join(candidate, 'index.html');
        if (statSync(index).isFile()) return index;
      }
    } catch {}
  }
  return null;
}

createServer((request, response) => {
  // Same prefix strip as the nginx rewrite, so /{backend}/{frontend}/ URLs work locally.
  const requested = new URL(request.url, 'http://localhost').pathname.replace(
    /^\/backend-[^/]+\/frontend-[^/]+/,
    '',
  );
  const file =
    findFile(requested) ||
    findFile(`${requested}.html`) ||
    findFile(`${requested}/`) ||
    findFile('/index.html');

  if (!file) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('404 Not Found\n');
    return;
  }

  response.writeHead(200, {
    'Content-Type': MIME[extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(file).pipe(response);
}).listen(PORT, () => {
  console.log(`frontend-javascript-jquery → http://localhost:${PORT}/`);
});
