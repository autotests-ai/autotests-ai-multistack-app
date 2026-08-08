import { afterEach, describe, expect, it, vi } from 'vitest';

// APP_BASE / API_BASE are resolved once at import time, so each case needs a fresh module.
async function loadFor(pathname) {
  window.history.replaceState({}, '', pathname);
  vi.resetModules();
  return import('../../app/lib/app-base.js');
}

afterEach(() => {
  window.history.replaceState({}, '', '/');
  vi.resetModules();
});

describe('app-base — mount precedence', () => {
  it('takes backend and frontend from the path matrix', async () => {
    const { APP_BASE, BACKEND_ID, appPath, apiUrl, authTokenStorageKey } = await loadFor(
      '/backend-java-spring/frontend-javascript-angular/login',
    );

    expect(APP_BASE).toBe('/backend-java-spring/frontend-javascript-angular');
    expect(BACKEND_ID).toBe('backend-java-spring');
    expect(authTokenStorageKey()).toBe('authToken:backend-java-spring');
    expect(appPath('/js/header.js')).toBe(
      '/backend-java-spring/frontend-javascript-angular/js/header.js',
    );
    expect(apiUrl('/api/health')).toBe('/backend-java-spring/api/health');
  });

  it('keeps a bare product mount when there is no backend prefix', async () => {
    const { APP_BASE, BACKEND_ID, appPath, apiUrl, authTokenStorageKey } = await loadFor(
      '/frontend-javascript-angular/login',
    );

    expect(APP_BASE).toBe('/frontend-javascript-angular');
    expect(BACKEND_ID).toBeNull();
    expect(authTokenStorageKey()).toBe('authToken');
    expect(appPath('/js/header.js')).toBe('/frontend-javascript-angular/js/header.js');
    expect(apiUrl('/api/health')).toBe('/api/health');
  });

  // The container publish-port and vite dev both serve the SPA here: a mount-shaped
  // base href matches nothing and the router renders an empty page.
  it('mounts at the document root when the path carries no mount at all', async () => {
    const { APP_BASE, BACKEND_ID, appPath, apiUrl, authTokenStorageKey } = await loadFor('/login');

    expect(APP_BASE).toBe('');
    expect(BACKEND_ID).toBeNull();
    expect(authTokenStorageKey()).toBe('authToken');
    expect(appPath('/')).toBe('/');
    expect(appPath('/js/header.js')).toBe('/js/header.js');
    expect(apiUrl('/api/health')).toBe('/api/health');
  });

  it('normalises paths handed to appPath and apiUrl', async () => {
    const { appPath, apiUrl } = await loadFor('/backend-java-spring/frontend-javascript-angular/');

    // Missing leading slash, empty and null all resolve to the mount root.
    expect(appPath('login')).toBe('/backend-java-spring/frontend-javascript-angular/login');
    expect(appPath('')).toBe('/backend-java-spring/frontend-javascript-angular/');
    expect(appPath(null)).toBe('/backend-java-spring/frontend-javascript-angular/');

    // An `/api` prefix is the caller's shorthand and must not be doubled.
    expect(apiUrl('health')).toBe('/backend-java-spring/api/health');
    expect(apiUrl('/api/health')).toBe('/backend-java-spring/api/health');
    expect(apiUrl('/api')).toBe('/backend-java-spring/api');
    expect(apiUrl('')).toBe('/backend-java-spring/api/');
  });

  it('scopes auth token keys per backend and shares them across frontends', async () => {
    const spring = await loadFor('/backend-java-spring/frontend-javascript-angular/');
    const fastapi = await loadFor('/backend-python-fastapi/frontend-typescript-vue/login');

    expect(spring.authTokenStorageKey()).toBe('authToken:backend-java-spring');
    expect(fastapi.authTokenStorageKey()).toBe('authToken:backend-python-fastapi');
    expect(spring.authTokenStorageKey('backend-python-fastapi')).toBe(
      'authToken:backend-python-fastapi',
    );
  });
});
