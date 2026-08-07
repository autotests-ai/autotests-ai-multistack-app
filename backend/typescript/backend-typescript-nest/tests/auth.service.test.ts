import { HttpException } from '@nestjs/common';

import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '../src/security/jwt.service';
import { seedData, SEED_PASSWORD, SEED_USERNAME } from '../src/store/seed';

import { TEST_CONFIG } from './support/app';
import { FakeStore } from './support/fake-store';

async function captureError(promise: Promise<unknown>): Promise<HttpException> {
  try {
    await promise;
  } catch (error) {
    return error as HttpException;
  }
  throw new Error('expected the call to reject');
}

async function expectApiError(
  promise: Promise<unknown>,
  status: number,
  message: string,
): Promise<void> {
  const error = await captureError(promise);
  expect(error).toBeInstanceOf(HttpException);
  expect(error.getStatus()).toBe(status);
  expect(error.getResponse()).toEqual({ message });
}

describe('AuthService', () => {
  let store: FakeStore;
  let service: AuthService;

  beforeEach(async () => {
    store = new FakeStore();
    await seedData(store);
    service = new AuthService(store, new JwtService(TEST_CONFIG));
  });

  it('registers a new user and returns the auth response', async () => {
    const response = await service.register({ username: 'newuser', password: 'password123' });

    expect(response.username).toBe('newuser');
    expect(response.redirectUrl).toBe('/');
    expect(await store.findUserByUsername('newuser')).not.toBeNull();
  });

  it('rejects a duplicate username with 409', async () => {
    await expectApiError(
      service.register({ username: SEED_USERNAME, password: SEED_PASSWORD }),
      409,
      'Username already taken',
    );
  });

  it('maps a lost unique-constraint race to 409', async () => {
    store.failNextInsertWithConflict = true;

    await expectApiError(
      service.register({ username: 'racer', password: 'password123' }),
      409,
      'Username already taken',
    );
  });

  it('propagates unexpected store failures instead of masking them as 409', async () => {
    const boom = new Error('connection lost');
    jest.spyOn(store, 'insertUser').mockRejectedValueOnce(boom);

    await expect(
      service.register({ username: 'newuser', password: 'password123' }),
    ).rejects.toBe(boom);
  });

  it('rejects invalid credentials with 400', async () => {
    await expectApiError(service.register({ password: 'password123' }), 400, 'username is required');
    await expectApiError(service.login({ username: 'ab', password: 'password123' }), 400, 'username must be 3-64 characters');
  });

  it('logs the seeded user in', async () => {
    const response = await service.login({
      username: SEED_USERNAME,
      password: SEED_PASSWORD,
    });

    expect(response.username).toBe(SEED_USERNAME);
    expect(response.token).toEqual(expect.any(String));
  });

  it('rejects a wrong password with 401', async () => {
    await expectApiError(
      service.login({ username: SEED_USERNAME, password: 'wrongpass' }),
      401,
      'Wrong login or password',
    );
  });

  it('rejects an unknown user with 401', async () => {
    await expectApiError(
      service.login({ username: 'ghost', password: 'password123' }),
      401,
      'Wrong login or password',
    );
  });

  it('resolves the profile of an existing user', async () => {
    await expect(service.profile(SEED_USERNAME)).resolves.toEqual({ username: SEED_USERNAME });
  });

  it('rejects the profile of a vanished user with 401', async () => {
    await expectApiError(service.profile('ghost'), 401, 'Unauthorized');
  });

  it('deletes the account of an existing user', async () => {
    await service.deleteAccount(SEED_USERNAME);

    expect(await store.findUserByUsername(SEED_USERNAME)).toBeNull();
  });

  it('rejects deleting an account that is already gone with 401', async () => {
    await expectApiError(service.deleteAccount('ghost'), 401, 'Unauthorized');
  });
});
