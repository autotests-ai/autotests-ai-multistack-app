import { afterEach, describe, expect, it, vi } from 'vitest';

// APP_BASE / API_BASE are resolved once at import time, so each case needs a fresh module.
async function loadFor(pathname) {
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
    const { APP_BASE, BACKEND_ID, appPath, apiUrl, authTokenStorageKey } = await loadFor(
      '/backend-java-spring/frontend-javascript-react/login',
    );

    expect(APP_BASE).toBe('/backend-java-spring/frontend-javascript-react');
    expect(BACKEND_ID).toBe('backend-java-spring');
    expect(authTokenStorageKey()).toBe('authToken:backend-java-spring');
    expect(appPath('/js/header.js')).toBe(
      '/backend-java-spring/frontend-javascript-react/js/header.js',
    );
    expect(apiUrl('/api/health')).toBe('/backend-java-spring/api/health');
  });

  it('keeps a bare product mount when there is no backend prefix', async () => {
    const { APP_BASE, BACKEND_ID, appPath, apiUrl, authTokenStorageKey } = await loadFor(
      '/frontend-javascript-react/login',
    );

    expect(APP_BASE).toBe('/frontend-javascript-react');
    expect(BACKEND_ID).toBeNull();
    expect(authTokenStorageKey()).toBe('authToken');
    expect(appPath('/js/header.js')).toBe('/frontend-javascript-react/js/header.js');
    expect(apiUrl('/api/health')).toBe('/api/health');
  });

  // The container publish-port and vite dev both serve the SPA here: a mount-shaped
  // basename matches nothing and the router renders an empty page.
  it('mounts at the document root when the path carries no mount at all', async () => {
    const { APP_BASE, BACKEND_ID, appPath, apiUrl, authTokenStorageKey } = await loadFor('/login');

    expect(APP_BASE).toBe('');
    expect(BACKEND_ID).toBeNull();
    expect(authTokenStorageKey()).toBe('authToken');
    expect(appPath('/')).toBe('/');
    expect(appPath('/js/header.js')).toBe('/js/header.js');
    expect(apiUrl('/api/health')).toBe('/api/health');
  });

  it('scopes auth token keys per backend and shares them across frontends', async () => {
    const spring = await loadFor('/backend-java-spring/frontend-javascript-react/');
    const fastapi = await loadFor('/backend-python-fastapi/frontend-javascript-vue/login');

    expect(spring.authTokenStorageKey()).toBe('authToken:backend-java-spring');
    expect(fastapi.authTokenStorageKey()).toBe('authToken:backend-python-fastapi');
    expect(spring.authTokenStorageKey('backend-python-fastapi')).toBe(
      'authToken:backend-python-fastapi',
    );
  });
});
