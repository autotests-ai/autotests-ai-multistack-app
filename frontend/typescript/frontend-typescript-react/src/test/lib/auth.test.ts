import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_TOKEN_KEY,
  formatMessage,
  getToken,
  login,
  logout,
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
});
