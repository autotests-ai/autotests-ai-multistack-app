/** Path matrix: /{backend}/{frontend}/ — runtime from location (shared dist × N backends). */
const PATH_RE = /^\/(backend-[^/]+)\/(frontend-[^/]+)/;
/** Product mount without a backend prefix — same precedence as the boot script in index.html. */
const MOUNT_RE = /^\/(frontend-[^/]+)/;

/** Product mount id (= matrix frontend.mount). Reported by the Health panel. */
export const UI_MOUNT = 'frontend-javascript-react';

function resolveFromPathname(pathname) {
  const matrix = pathname.match(PATH_RE);
  if (matrix) {
    const backendId = matrix[1];
    const frontendMount = matrix[2];
    return {
      backendId,
      frontendMount,
      appBase: `/${backendId}/${frontendMount}`,
      apiBase: `/${backendId}/api`,
    };
  }
  const bare = pathname.match(MOUNT_RE);
  if (bare) {
    return {
      backendId: null,
      frontendMount: bare[1],
      appBase: `/${bare[1]}`,
      apiBase: '/api',
    };
  }
  // Container publish-port, vite dev and jsdom all serve the SPA at the document root:
  // a mount-shaped basename would leave the router with nothing to match.
  return {
    backendId: null,
    frontendMount: UI_MOUNT,
    appBase: '',
    apiBase: '/api',
  };
}

const resolved = resolveFromPathname(typeof window !== 'undefined' ? window.location.pathname : '');

/** Router basename — trailing slash omitted. */
export const APP_BASE = resolved.appBase;
/** API origin path for this backend — no trailing slash. */
export const API_BASE = resolved.apiBase;
/** Matrix backend id (`backend-…`), or null outside `/{backend}/{frontend}/`. */
export const BACKEND_ID = resolved.backendId;

/**
 * localStorage key for the auth token.
 * Scoped by backend so sessions do not leak across backends on the same origin;
 * shared across frontends for the same backend.
 *
 * @param {string | null} [backendId]
 * @returns {string}
 */
export function authTokenStorageKey(backendId = BACKEND_ID) {
  return backendId ? `authToken:${backendId}` : 'authToken';
}

/**
 * Prefix a same-origin path with the product mount.
 * `appPath('/')` → `/{backend}/{frontend}/`
 * `appPath('/login')` → `/{backend}/{frontend}/login`
 *
 * @param {string} [path]
 * @returns {string}
 */
export function appPath(path = '/') {
  let p = path == null || path === '' ? '/' : String(path);
  if (!p.startsWith('/')) {
    p = `/${p}`;
  }
  return `${APP_BASE}${p}`;
}

/**
 * Build API URL: `apiUrl('/health')` → `/{backend}/api/health`.
 *
 * @param {string} path
 * @returns {string}
 */
export function apiUrl(path) {
  let p = path == null || path === '' ? '' : String(path);
  if (!p.startsWith('/')) {
    p = `/${p}`;
  }
  if (p.startsWith('/api/')) {
    p = p.slice(4);
  } else if (p === '/api') {
    p = '';
  }
  return `${API_BASE}${p}`;
}
