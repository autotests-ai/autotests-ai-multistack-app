import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_TOKEN_KEY,
  deleteAccount,
  fetchProfile,
  formatMessage,
  getToken,
  login,
  logout,
  register,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from '../../lib/auth';
import { LOGIN_MESSAGES } from '../../lib/messages';

describe('validateCredentials', () => {
  it('requires both when empty', () => {
    expect(validateCredentials('', '', LOGIN_MESSAGES)).toBe(
      'Login and password are required (minimum 3 and 6 characters)',
    );
  });

  it('requires login', () => {
    expect(validateCredentials('', 'password1', LOGIN_MESSAGES)).toBe(
      'Login is required (minimum 3 characters)',
    );
  });

  it('enforces login minimum length', () => {
    expect(validateCredentials('ab', 'password1', LOGIN_MESSAGES)).toBe(
      'Login must be at least 3 characters',
    );
  });

  it('requires password', () => {
    expect(validateCredentials('user1', '', LOGIN_MESSAGES)).toBe(
      'Password is required (minimum 6 characters)',
    );
  });

  it('enforces password minimum length', () => {
    expect(validateCredentials('user1', '123', LOGIN_MESSAGES)).toBe(
      'Password must be at least 6 characters',
    );
  });

  it('passes for valid credentials', () => {
    expect(validateCredentials('user1', 'password1', LOGIN_MESSAGES)).toBeNull();
  });
});

describe('formatMessage', () => {
  it('substitutes placeholders and drops unknown keys', () => {
    expect(formatMessage('at least {min} chars, {unknown}', { min: 3 })).toBe('at least 3 chars, ');
  });
});

describe('network failures', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('login maps a failed fetch to the network error copy', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('connection refused')));

    const error = await login('user1', 'password1').catch((err: unknown) => err);

    expect(error).toMatchObject({ network: true });
    expect(resolveAuthErrorMessage(error, LOGIN_MESSAGES, 'fallback')).toBe(
      'Network error. Check your connection and try again.',
    );
  });

  it('resolveAuthErrorMessage prefers the API message and falls back last', () => {
    expect(
      resolveAuthErrorMessage(new Error('Wrong login or password'), LOGIN_MESSAGES, 'fb'),
    ).toBe('Wrong login or password');
    expect(resolveAuthErrorMessage(new Error(''), LOGIN_MESSAGES, 'fb')).toBe('fb');
    expect(resolveAuthErrorMessage(undefined, LOGIN_MESSAGES, 'fb')).toBe('fb');
  });

  it('logout clears the stored token even when the API call fails', async () => {
    saveSession('token-123');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await logout();

    expect(getToken()).toBeNull();
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });

  it('logout is a no-op when there is no session', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await logout();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(getToken()).toBeNull();
  });

  it('logout sends POST /auth/logout with the bearer token', async () => {
    saveSession('token-123');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', fetchMock);

    await logout();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-123' },
    });
    expect(getToken()).toBeNull();
  });

  it('getToken returns null when localStorage is unavailable', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(getToken()).toBeNull();
    getItem.mockRestore();
  });

  it('saveSession swallows a disabled localStorage', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(() => saveSession('tok')).not.toThrow();
    setItem.mockRestore();
  });

  it('login throws Request failed when the error body has no message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      }),
    );

    await expect(login('user1', 'password1')).rejects.toThrow('Request failed');
  });

  it('login returns the API payload on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'tok-1', username: 'user1' }),
      }),
    );

    await expect(login('user1', 'password1')).resolves.toEqual({
      token: 'tok-1',
      username: 'user1',
    });
  });

  it('login treats a failed JSON body as an empty object', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error('not json');
        },
      }),
    );

    await expect(login('user1', 'password1')).rejects.toThrow('Request failed');
  });
});

describe('fetchProfile', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refuses to call the API without a token', () => {
    expect(() => fetchProfile()).toThrow('Missing auth token');
  });

  it('fetches /auth/me with the bearer token', async () => {
    saveSession('token-123');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ username: 'user1' }),
      }),
    );

    await expect(fetchProfile()).resolves.toEqual({ username: 'user1' });
  });
});

describe('register', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts credentials to /auth/register', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'tok-reg', username: 'newuser' }),
      }),
    );

    await expect(register('newuser', 'password1')).resolves.toEqual({
      token: 'tok-reg',
      username: 'newuser',
    });
  });
});

describe('deleteAccount', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends DELETE /auth/me with the bearer token and clears the session', async () => {
    saveSession('token-123');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', fetchMock);

    await deleteAccount();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer token-123' },
    });
    expect(getToken()).toBeNull();
  });

  it('skips the request when there is no session', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await deleteAccount();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(getToken()).toBeNull();
  });

  // Same policy as logout: a dead token must never keep the UI signed in.
  it('clears the stored token when the API rejects the call', async () => {
    saveSession('token-123');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    await deleteAccount();

    expect(getToken()).toBeNull();
  });

  it('clears the stored token when the network call fails', async () => {
    saveSession('token-123');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await deleteAccount();

    expect(getToken()).toBeNull();
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });

  // Account deletion is not logout: the logout endpoint must never be touched.
  it('never calls the logout endpoint', async () => {
    saveSession('token-123');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', fetchMock);

    await deleteAccount();

    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(['/api/auth/me']);
  });
});
