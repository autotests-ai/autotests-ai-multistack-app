import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadAuthRuntime } from './helpers/page.js';

const LOGIN_MESSAGES = {
  errorBothRequired:
    'Login and password are required (minimum {minLogin} and {minPassword} characters)',
  errorLoginRequired: 'Login is required (minimum {minLogin} characters)',
  errorLoginMinLength: 'Login must be at least {minLogin} characters',
  errorPasswordRequired: 'Password is required (minimum {minPassword} characters)',
  errorPasswordMinLength: 'Password must be at least {minPassword} characters',
  errorWrongCredentials: 'Wrong login or password',
  errorNetwork: 'Network error. Check your connection and try again.',
};

let auth;

beforeEach(() => {
  localStorage.clear();
  loadAuthRuntime();
  auth = window.ReferenceAuth;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('window.ReferenceAuth', () => {
  it('exposes the same surface as the other reference modules', () => {
    expect(Object.keys(auth).sort()).toEqual(
      [
        'AUTH_TOKEN_KEY',
        'MIN_LOGIN_LENGTH',
        'MIN_PASSWORD_LENGTH',
        'clearSession',
        'deleteAccount',
        'fetchProfile',
        'formatMessage',
        'getToken',
        'login',
        'logout',
        'register',
        'resolveAuthErrorMessage',
        'saveSession',
        'validateCredentials',
      ].sort(),
    );
  });

  it('keys the token by backend only when a backend prefix is mounted', () => {
    expect(auth.AUTH_TOKEN_KEY).toBe('authToken');
    expect(window.API_BASE).toBe('/api');
    expect(window.UI_MOUNT).toBe('frontend-javascript-jquery');
  });
});

describe('validateCredentials', () => {
  it('requires both when empty', () => {
    expect(auth.validateCredentials('', '', LOGIN_MESSAGES)).toBe(
      'Login and password are required (minimum 3 and 6 characters)',
    );
  });

  it('requires login', () => {
    expect(auth.validateCredentials('', 'password1', LOGIN_MESSAGES)).toBe(
      'Login is required (minimum 3 characters)',
    );
  });

  it('enforces login minimum length', () => {
    expect(auth.validateCredentials('ab', 'password1', LOGIN_MESSAGES)).toBe(
      'Login must be at least 3 characters',
    );
  });

  it('requires password', () => {
    expect(auth.validateCredentials('user1', '', LOGIN_MESSAGES)).toBe(
      'Password is required (minimum 6 characters)',
    );
  });

  it('enforces password minimum length', () => {
    expect(auth.validateCredentials('user1', '123', LOGIN_MESSAGES)).toBe(
      'Password must be at least 6 characters',
    );
  });

  it('passes for valid credentials', () => {
    expect(auth.validateCredentials('user1', 'password1', LOGIN_MESSAGES)).toBeNull();
  });
});

describe('formatMessage', () => {
  it('substitutes placeholders and drops unknown keys', () => {
    expect(auth.formatMessage('at least {min} chars, {unknown}', { min: 3 })).toBe(
      'at least 3 chars, ',
    );
  });
});

describe('network failures', () => {
  it('login maps a failed fetch to the network error copy', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('connection refused')));

    const error = await auth.login('user1', 'password1').catch((err) => err);

    expect(error).toMatchObject({ network: true });
    expect(auth.resolveAuthErrorMessage(error, LOGIN_MESSAGES, 'fallback')).toBe(
      'Network error. Check your connection and try again.',
    );
  });

  it('resolveAuthErrorMessage prefers the API message and falls back last', () => {
    expect(
      auth.resolveAuthErrorMessage(new Error('Wrong login or password'), LOGIN_MESSAGES, 'fb'),
    ).toBe('Wrong login or password');
    expect(auth.resolveAuthErrorMessage(new Error(''), LOGIN_MESSAGES, 'fb')).toBe('fb');
    expect(auth.resolveAuthErrorMessage(undefined, LOGIN_MESSAGES, 'fb')).toBe('fb');
  });

  it('logout clears the stored token even when the API call fails', async () => {
    auth.saveSession('token-123');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await auth.logout();

    expect(auth.getToken()).toBeNull();
    expect(localStorage.getItem(auth.AUTH_TOKEN_KEY)).toBeNull();
  });

  it('logout posts the bearer token and clears the session', async () => {
    auth.saveSession('token-123');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', fetchMock);

    await auth.logout();

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-123' },
    });
    expect(auth.getToken()).toBeNull();
  });
});

describe('fetchProfile', () => {
  // jQuery auth wraps fetchProfile as async — missing token rejects the promise.
  it('refuses to call the API without a token', async () => {
    await expect(auth.fetchProfile()).rejects.toThrow('Missing auth token');
  });
});

describe('deleteAccount', () => {
  it('sends DELETE /auth/me with the bearer token and clears the session', async () => {
    auth.saveSession('token-123');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', fetchMock);

    await auth.deleteAccount();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer token-123' },
    });
    expect(auth.getToken()).toBeNull();
  });

  it('skips the request when there is no session', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await auth.deleteAccount();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(auth.getToken()).toBeNull();
  });

  // Same policy as logout: a dead token must never keep the UI signed in.
  it('clears the stored token when the API rejects the call', async () => {
    auth.saveSession('token-123');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    await auth.deleteAccount();

    expect(auth.getToken()).toBeNull();
  });

  it('clears the stored token when the network call fails', async () => {
    auth.saveSession('token-123');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await auth.deleteAccount();

    expect(auth.getToken()).toBeNull();
    expect(localStorage.getItem(auth.AUTH_TOKEN_KEY)).toBeNull();
  });

  // Account deletion, not logout — the logout endpoint must stay untouched.
  it('never calls the logout endpoint', async () => {
    auth.saveSession('token-123');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', fetchMock);

    await auth.deleteAccount();

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/auth/me']);
  });
});
