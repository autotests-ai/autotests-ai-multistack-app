'use strict';

const { validateCredentials } = require('../src/validation');

describe('validateCredentials', () => {
  it('accepts credentials inside both length windows', () => {
    expect(validateCredentials('user1', 'password1')).toBeNull();
    expect(validateCredentials('abc', '123456')).toBeNull();
    expect(validateCredentials('a'.repeat(64), 'p'.repeat(128))).toBeNull();
  });

  it.each([undefined, null, '', 42, {}, []])(
    'reports a missing username for %p',
    (username) => {
      expect(validateCredentials(username, 'password1')).toBe(
        'username is required'
      );
    }
  );

  it.each([undefined, null, '', 42, {}, []])(
    'reports a missing password for %p',
    (password) => {
      expect(validateCredentials('user1', password)).toBe(
        'password is required'
      );
    }
  );

  it('rejects a username outside 3-64 characters', () => {
    expect(validateCredentials('ab', 'password1')).toBe(
      'username must be 3-64 characters'
    );
    expect(validateCredentials('a'.repeat(65), 'password1')).toBe(
      'username must be 3-64 characters'
    );
  });

  it('rejects a password outside 6-128 characters', () => {
    expect(validateCredentials('user1', '12345')).toBe(
      'password must be 6-128 characters'
    );
    expect(validateCredentials('user1', 'p'.repeat(129))).toBe(
      'password must be 6-128 characters'
    );
  });

  it('reports the username problem before the password problem', () => {
    expect(validateCredentials('ab', '123')).toBe(
      'username must be 3-64 characters'
    );
  });
});
