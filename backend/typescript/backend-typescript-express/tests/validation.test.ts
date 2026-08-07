import { validateCredentials } from '../src/validation';

describe('validateCredentials', () => {
  it('accepts credentials inside the allowed lengths', () => {
    expect(validateCredentials('user1', 'password1')).toBeNull();
    expect(validateCredentials('abc', '123456')).toBeNull();
    expect(validateCredentials('u'.repeat(64), 'p'.repeat(128))).toBeNull();
  });

  it.each([undefined, null, '', 42, {}])('rejects a missing username (%p)', (value) => {
    expect(validateCredentials(value, 'password1')).toBe('username is required');
  });

  it.each([undefined, null, '', 42, {}])('rejects a missing password (%p)', (value) => {
    expect(validateCredentials('user1', value)).toBe('password is required');
  });

  it('rejects a username outside 3-64 characters', () => {
    expect(validateCredentials('ab', 'password1')).toBe('username must be 3-64 characters');
    expect(validateCredentials('u'.repeat(65), 'password1')).toBe(
      'username must be 3-64 characters',
    );
  });

  it('rejects a password outside 6-128 characters', () => {
    expect(validateCredentials('user1', 'short')).toBe('password must be 6-128 characters');
    expect(validateCredentials('user1', 'p'.repeat(129))).toBe(
      'password must be 6-128 characters',
    );
  });

  it('joins every failing field with "; ", username first', () => {
    expect(validateCredentials('', '')).toBe('username is required; password is required');
    expect(validateCredentials('ab', 'x')).toBe(
      'username must be 3-64 characters; password must be 6-128 characters',
    );
    expect(validateCredentials('ab', '')).toBe(
      'username must be 3-64 characters; password is required',
    );
  });
});
