/** Path matrix: /{backend}/{frontend}/ — runtime from location (shared dist × N backends). */
const PATH_RE = /^\/(backend-[^/]+)\/(frontend-[^/]+)/;

/** Product mount id (= matrix frontend.mount). Used when URL has no backend prefix (jsdom / vite). */
export const UI_MOUNT = 'frontend-typescript-vue';

function resolveFromPathname(pathname: string) {
  const match = pathname.match(PATH_RE);
  if (match) {
    const backendId = match[1];
    const frontendMount = match[2];
    return {
      backendId,
      frontendMount,
      appBase: `/${backendId}/${frontendMount}`,
      apiBase: `/${backendId}/api`,
    };
  }
  return {
    backendId: null as string | null,
    frontendMount: UI_MOUNT,
    appBase: `/${UI_MOUNT}`,
    apiBase: '/api',
  };
}

const resolved = resolveFromPathname(
  typeof window !== 'undefined' ? window.location.pathname : '',
);

/** Router basename — trailing slash omitted. */
export const APP_BASE = resolved.appBase;
/** API origin path for this backend — no trailing slash. */
export const API_BASE = resolved.apiBase;

/**
 * Prefix a same-origin path with the product mount.
 * `appPath('/')` → `/{backend}/{frontend}/`
 * `appPath('/login')` → `/{backend}/{frontend}/login`
 */
export function appPath(path: string = '/'): string {
  let p = path == null || path === '' ? '/' : String(path);
  if (!p.startsWith('/')) {
    p = `/${p}`;
  }
  return `${APP_BASE}${p}`;
}

/** Build API URL: `apiUrl('/health')` → `/{backend}/api/health`. */
export function apiUrl(path: string): string {
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
