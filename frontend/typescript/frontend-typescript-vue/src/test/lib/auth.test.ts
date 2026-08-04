import { describe, expect, it } from 'vitest';
import { validateCredentials } from '../../lib/auth';
import { LOGIN_MESSAGES } from '../../lib/messages';

describe('validateCredentials', () => {
  it('requires both fields when empty', () => {
    expect(validateCredentials('', '', LOGIN_MESSAGES)).toBe(
      'Login and password are required (minimum 3 and 6 characters)',
    );
  });

  it('requires login when username is empty', () => {
    expect(validateCredentials('', 'password1', LOGIN_MESSAGES)).toBe(
      'Login is required (minimum 3 characters)',
    );
  });

  it('requires password when password is empty', () => {
    expect(validateCredentials('user1', '', LOGIN_MESSAGES)).toBe(
      'Password is required (minimum 6 characters)',
    );
  });

  it('returns null for valid credentials', () => {
    expect(validateCredentials('user1', 'password1', LOGIN_MESSAGES)).toBeNull();
  });
});
