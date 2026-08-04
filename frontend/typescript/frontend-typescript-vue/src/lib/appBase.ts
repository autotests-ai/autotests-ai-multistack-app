/** Product URL mount (= compose UI_MOUNT). Trailing slash omitted for Router basename. */
export const UI_MOUNT = 'frontend-typescript-vue';
export const APP_BASE = `/${UI_MOUNT}`;

/**
 * Prefix a same-origin path with the product mount (vanilla `appPath` equivalent).
 * `appPath('/')` → `/frontend-typescript-vue/`
 * `appPath('/login')` → `/frontend-typescript-vue/login`
 */
export function appPath(path: string = '/'): string {
  let p = path == null || path === '' ? '/' : String(path);
  if (!p.startsWith('/')) {
    p = `/${p}`;
  }
  return `${APP_BASE}${p}`;
}
