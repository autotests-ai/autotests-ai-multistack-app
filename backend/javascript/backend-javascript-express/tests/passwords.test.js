'use strict';

const { hashPassword, checkPassword } = require('../src/passwords');

describe('password hashing', () => {
  it('produces a bcrypt hash that does not contain the plaintext', () => {
    const hash = hashPassword('password1');
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(hash).not.toContain('password1');
  });

  it('salts, so the same password hashes differently every time', () => {
    expect(hashPassword('password1')).not.toBe(hashPassword('password1'));
  });

  it('accepts the correct password and rejects a wrong one', () => {
    const hash = hashPassword('password1');
    expect(checkPassword('password1', hash)).toBe(true);
    expect(checkPassword('password2', hash)).toBe(false);
    expect(checkPassword('', hash)).toBe(false);
  });

  it.each([undefined, null, '', 'not-a-bcrypt-hash'])(
    'returns false for the unusable hash %p',
    (hash) => {
      expect(checkPassword('password1', hash)).toBe(false);
    }
  );
});
