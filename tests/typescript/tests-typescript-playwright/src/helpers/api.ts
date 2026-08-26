import { faker } from '@faker-js/faker';
import type { APIRequestContext } from '@playwright/test';
import { apiRoot } from './env';

export const WRONG_CREDENTIALS_MESSAGE = 'Wrong login or password';

export function username(): string {
  return `user_${faker.string.alphanumeric(10)}`;
}

/**
 * Cleanup through the product API: log in as the user the test registered and delete the
 * account (DELETE /api/auth/me), so the stand does not accumulate user_* rows.
 * Best-effort by design — a failed cleanup must not mask the test's own result.
 */
export async function deleteAccountQuietly(
  request: APIRequestContext,
  name: string,
  password: string,
): Promise<void> {
  try {
    const root = apiRoot();
    const login = await request.post(`${root}/api/auth/login`, {
      data: { username: name, password },
    });
    if (!login.ok()) {
      return;
    }
    const { token } = (await login.json()) as { token?: string };
    if (!token) {
      return;
    }
    await request.delete(`${root}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // stand unreachable / user never created — nothing to clean
  }
}
