import { registerServiceWorker as registerPwa } from './pwa-register.js';

/**
 * Heir wrapper around design-system `js/pwa-register.js` (committed copy).
 * Vite DEV has no real `/sw.js` — skip registration. Prod SW lives under the
 * Vite `base` mount (`/frontend-typescript-vue/sw.js`).
 */
export function registerServiceWorker(): void {
  if (import.meta.env.DEV) {
    return;
  }
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  registerPwa({ immediate: true, swUrl: `${base}sw.js` });
}
