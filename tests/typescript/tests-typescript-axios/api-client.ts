/** HTTP helpers — axios analog of java AuthApiClient + Rest Assured specs. */

import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { randomBytes } from 'node:crypto';
import type { TestConfig } from './config';

const TIMEOUT_MS = 10_000;
export const WRONG_CREDENTIALS_MESSAGE = 'Wrong login or password';

/** Backend mount above the frontend segment (or the origin on root deploys). */
export function apiRoot(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '').replace(/\/frontend-[^/]+$/, '');
}

export function apiBase(config: TestConfig): string {
  return config.apiBaseUrl.replace(/\/+$/, '');
}

/** Throwaway identity; backend @Size(min=3, max=64). */
export function username(): string {
  return `user_${randomBytes(5).toString('hex')}`;
}

function pathOf(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

type RequestOpts = {
  json?: unknown;
  raw?: string;
  token?: string;
};

export function newClient(config: TestConfig): AxiosInstance {
  return axios.create({
    baseURL: apiBase(config),
    timeout: TIMEOUT_MS,
    validateStatus: () => true,
  });
}

export async function request(
  config: TestConfig,
  method: string,
  path: string,
  { json, raw, token }: RequestOpts = {},
): Promise<AxiosResponse> {
  const headers: Record<string, string> = {};
  if (json !== undefined || raw !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  let data: unknown;
  if (raw !== undefined) {
    data = raw;
  } else if (json !== undefined) {
    data = json;
  }
  return newClient(config).request({
    method,
    url: pathOf(path),
    headers,
    data,
    transformRequest: raw !== undefined ? [(body) => body] : undefined,
  });
}

export async function login(config: TestConfig, name: string, password: string): Promise<string> {
  const response = await request(config, 'POST', '/api/auth/login', {
    json: { username: name, password },
  });
  if (response.status !== 200) {
    throw new Error(`login ${name}: ${response.status} ${JSON.stringify(response.data)}`);
  }
  return String((response.data as { token: string }).token);
}

export async function register(
  config: TestConfig,
  name: string,
  password: string,
): Promise<string> {
  const response = await request(config, 'POST', '/api/auth/register', {
    json: { username: name, password },
  });
  if (response.status !== 201) {
    throw new Error(`register ${name}: ${response.status} ${JSON.stringify(response.data)}`);
  }
  return String((response.data as { token: string }).token);
}

export async function deleteAccount(config: TestConfig, token: string): Promise<void> {
  const response = await request(config, 'DELETE', '/api/auth/me', { token });
  if (response.status !== 204) {
    throw new Error(`delete me: ${response.status} ${JSON.stringify(response.data)}`);
  }
}

/**
 * Log in as the user the test registered and DELETE /api/auth/me.
 *
 * Best-effort by design: a failed cleanup (user never created, stand down)
 * must not mask the test's own result.
 */
export async function deleteAccountQuietly(
  config: TestConfig,
  name: string,
  password: string,
): Promise<void> {
  try {
    await deleteAccount(config, await login(config, name, password));
  } catch {
    // stand unreachable / user never created — nothing to clean
  }
}
