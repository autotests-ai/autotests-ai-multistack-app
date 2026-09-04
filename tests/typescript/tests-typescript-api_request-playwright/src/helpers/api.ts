import { faker } from '@faker-js/faker';
import type { APIRequestContext } from '@playwright/test';
import { apiRoot } from './env';

export const WRONG_CREDENTIALS_MESSAGE = 'Wrong login or password';

export function username(): string {
  return `user_${faker.string.alphanumeric(10)}`;
}

export function usernameAtMinLength(): string {
  return faker.string.alphanumeric(3).toLowerCase();
}

export function passwordAtMinLength(): string {
  return '123456';
}

type ApiRequestOpts = {
  token?: string;
  json?: unknown;
  raw?: string;
};

export async function apiRequest(
  method: string,
  path: string,
  { token, json, raw }: ApiRequestOpts = {},
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (json !== undefined || raw !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  let body: string | undefined;
  if (raw !== undefined) {
    body = raw;
  } else if (json !== undefined) {
    body = JSON.stringify(json);
  }
  return fetch(`${apiRoot()}${path}`, { method, headers, body });
}

export async function loginToken(name: string, password: string): Promise<string> {
  const response = await apiRequest('POST', '/api/auth/login', {
    json: { username: name, password },
  });
  if (!response.ok) {
    throw new Error(`login ${name}: ${response.status}`);
  }
  const body = (await response.json()) as { token?: string };
  if (!body.token) {
    throw new Error(`login ${name}: no token`);
  }
  return body.token;
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
