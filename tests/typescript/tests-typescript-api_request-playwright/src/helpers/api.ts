import { faker } from '@faker-js/faker';
import type { APIRequestContext, APIResponse } from '@playwright/test';
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

/**
 * Product HTTP via Playwright {@link APIRequestContext} — not `fetch`, not Axios.
 * Absolute URL from {@link apiRoot}: the request fixture's baseURL is the UI origin.
 */
export async function apiRequest(
  request: APIRequestContext,
  method: string,
  path: string,
  { token, json, raw }: ApiRequestOpts = {},
): Promise<APIResponse> {
  const headers: Record<string, string> = {};
  if (json !== undefined || raw !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const url = `${apiRoot()}${path}`;
  const options: { headers: Record<string, string>; data?: unknown } = { headers };
  if (raw !== undefined) {
    options.data = raw;
  } else if (json !== undefined) {
    options.data = json;
  }
  switch (method.toUpperCase()) {
    case 'GET':
      return request.get(url, options);
    case 'POST':
      return request.post(url, options);
    case 'PUT':
      return request.put(url, options);
    case 'DELETE':
      return request.delete(url, options);
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
}

export async function loginToken(
  request: APIRequestContext,
  name: string,
  password: string,
): Promise<string> {
  const response = await apiRequest(request, 'POST', '/api/auth/login', {
    json: { username: name, password },
  });
  if (!response.ok()) {
    throw new Error(`login ${name}: ${response.status()}`);
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
    const login = await apiRequest(request, 'POST', '/api/auth/login', {
      json: { username: name, password },
    });
    if (!login.ok()) {
      return;
    }
    const { token } = (await login.json()) as { token?: string };
    if (!token) {
      return;
    }
    await apiRequest(request, 'DELETE', '/api/auth/me', { token });
  } catch {
    // stand unreachable / user never created — nothing to clean
  }
}
