/**
 * Static cell stand (vanilla / jquery): module files layered over vendor/ds,
 * same as the Dockerfile. No copy into the git tree. PORT from the environment.
 */
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';

const MODULE_ROOT = resolve(process.cwd());
const OVERLAY_ROOT = resolve(MODULE_ROOT, 'vendor/ds');
const ROOTS = [MODULE_ROOT, OVERLAY_ROOT];
const PORT = Number(process.env.PORT || 9800);

const NOT_SERVED = [
  '.git',
  '.stand-overlay',
  '.vite',
  'Dockerfile',
  'README.md',
  'coverage',
  'dist',
  'nginx.conf',
  'node_modules',
  'package-lock.json',
  'package.json',
  'projects',
  'scripts',
  'src',
  'vendor/ds',
  'vitest.config.js',
  'vitest.config.ts',
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
    } catch {
      /* missing */
    }
  }
  return null;
}

createServer((request, response) => {
  const requested = new URL(request.url, 'http://localhost').pathname
    .replace(/^\/stack\/(?:backend-[^/]+\/)?frontend-[^/]+/, '')
    .replace(/^\/backend-[^/]+\/frontend-[^/]+/, '');
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
  console.log(`${MODULE_ROOT.split(/[/\\]/).at(-1)} → http://localhost:${PORT}/`);
});
