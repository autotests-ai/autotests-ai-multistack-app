import { checkPassword, hashPassword } from '../src/security/password';

describe('password hashing', () => {
  it('produces a bcrypt hash that is not the plaintext', async () => {
    const hash = await hashPassword('password1');
    expect(hash).not.toBe('password1');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('accepts the correct password', async () => {
    const hash = await hashPassword('password1');
    await expect(checkPassword('password1', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('password1');
    await expect(checkPassword('password2', hash)).resolves.toBe(false);
  });

  it('salts, so the same password hashes differently each time', async () => {
    expect(await hashPassword('password1')).not.toBe(await hashPassword('password1'));
  });
});
