import { describe, expect, it } from 'vitest';
import { validateCredentials } from '../../lib/auth';
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
