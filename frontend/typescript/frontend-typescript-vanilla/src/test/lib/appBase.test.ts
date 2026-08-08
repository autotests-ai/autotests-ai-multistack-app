import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE, APP_BASE, appPath, apiUrl, authTokenStorageKey, UI_MOUNT } from '../../appBase';
import { restoreLocation, stubLocation } from '../harness';

/** appBase resolves the mount once at import, so each shape needs a fresh module. */
async function resolveAt(pathname: string) {
  stubLocation(pathname);
  vi.resetModules();
  return await import('../../appBase');
}

describe('appBase at the document root', () => {
  it('reports the module id as the mount', () => {
    expect(UI_MOUNT).toBe('frontend-typescript-vanilla');
  });

  it('serves from the document root without a mount prefix', () => {
    expect(APP_BASE).toBe('');
    expect(API_BASE).toBe('/api');
    expect(appPath('/login')).toBe('/login');
    expect(authTokenStorageKey()).toBe('authToken');
  });

  it('normalises paths and collapses a leading /api', () => {
    expect(appPath()).toBe('/');
    expect(appPath('login')).toBe('/login');
    expect(apiUrl('/health')).toBe('/api/health');
    expect(apiUrl('items')).toBe('/api/items');
    expect(apiUrl('/api/items')).toBe('/api/items');
    expect(apiUrl('/api')).toBe('/api');
  });
});

describe('appBase path matrix', () => {
  afterEach(() => {
    restoreLocation();
    vi.resetModules();
  });

  it('resolves /{backend}/{frontend} to a backend-scoped API and token key', async () => {
    const base = await resolveAt('/backend-java-spring/frontend-typescript-vanilla/login');

    expect(base.BACKEND_ID).toBe('backend-java-spring');
    expect(base.APP_BASE).toBe('/backend-java-spring/frontend-typescript-vanilla');
    expect(base.API_BASE).toBe('/backend-java-spring/api');
    expect(base.appPath('/login')).toBe(
      '/backend-java-spring/frontend-typescript-vanilla/login',
    );
    expect(base.apiUrl('/auth/me')).toBe('/backend-java-spring/api/auth/me');
    expect(base.authTokenStorageKey()).toBe('authToken:backend-java-spring');
  });

  it('resolves a bare /{frontend} mount against the shared /api', async () => {
    const base = await resolveAt('/frontend-typescript-vanilla/register');

    expect(base.BACKEND_ID).toBeNull();
    expect(base.APP_BASE).toBe('/frontend-typescript-vanilla');
    expect(base.API_BASE).toBe('/api');
    expect(base.authTokenStorageKey()).toBe('authToken');
  });
});

describe('authTokenStorageKey', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('scopes the key by backend so sessions do not leak across backends', () => {
    expect(authTokenStorageKey('backend-python-fastapi')).toBe('authToken:backend-python-fastapi');
    expect(authTokenStorageKey(null)).toBe('authToken');
  });
});
