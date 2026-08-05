import { afterEach, describe, expect, it, vi } from 'vitest';

// APP_BASE / API_BASE are resolved once at import time, so each case needs a fresh module.
async function loadFor(pathname: string) {
  window.history.replaceState({}, '', pathname);
  vi.resetModules();
  return import('../../lib/appBase');
}

afterEach(() => {
  window.history.replaceState({}, '', '/');
  vi.resetModules();
});

describe('appBase — mount precedence', () => {
  it('takes backend and frontend from the path matrix', async () => {
    const { APP_BASE, appPath, apiUrl } = await loadFor(
      '/backend-java-spring/frontend-typescript-react/login',
    );

    expect(APP_BASE).toBe('/backend-java-spring/frontend-typescript-react');
    expect(appPath('/js/header.js')).toBe(
      '/backend-java-spring/frontend-typescript-react/js/header.js',
    );
    expect(apiUrl('/api/health')).toBe('/backend-java-spring/api/health');
  });

  it('keeps a bare product mount when there is no backend prefix', async () => {
    const { APP_BASE, appPath, apiUrl } = await loadFor('/frontend-typescript-react/login');

    expect(APP_BASE).toBe('/frontend-typescript-react');
    expect(appPath('/js/header.js')).toBe('/frontend-typescript-react/js/header.js');
    expect(apiUrl('/api/health')).toBe('/api/health');
  });

  // The container publish-port and vite dev both serve the SPA here: a mount-shaped
  // basename matches nothing and the router renders an empty page.
  it('mounts at the document root when the path carries no mount at all', async () => {
    const { APP_BASE, appPath, apiUrl } = await loadFor('/login');

    expect(APP_BASE).toBe('');
    expect(appPath('/')).toBe('/');
    expect(appPath('/js/header.js')).toBe('/js/header.js');
    expect(apiUrl('/api/health')).toBe('/api/health');
  });
});
