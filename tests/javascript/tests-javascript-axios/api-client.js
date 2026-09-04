/** HTTP helpers — axios analog of java AuthApiClient + Rest Assured specs. */

import axios from 'axios';
import { randomBytes } from 'node:crypto';
import { resolveApiBaseUrl } from './config.js';

const TIMEOUT_MS = 10_000;
export const WRONG_CREDENTIALS_MESSAGE = 'Wrong login or password';

/** Backend mount above the frontend segment (or the origin on root deploys). */
export function apiRoot(baseUrl) {
  return baseUrl.replace(/\/+$/, '').replace(/\/frontend-[^/]+$/, '');
}

export function apiBase(config) {
  return resolveApiBaseUrl(config).replace(/\/+$/, '');
}

/** Throwaway identity; backend @Size(min=3, max=64). */
export function username() {
  return `user_${randomBytes(5).toString('hex')}`;
}

export function usernameAtMinLength() {
  return randomBytes(2).toString('hex').slice(0, 3);
}

export function passwordAtMinLength() {
  return '123456';
}

function pathOf(path) {
  return path.startsWith('/') ? path : `/${path}`;
}

export function newClient(config) {
  return axios.create({
    baseURL: apiBase(config),
    timeout: TIMEOUT_MS,
    validateStatus: () => true,
  });
}

export async function request(config, method, path, { json, raw, token } = {}) {
  const headers = {};
  if (json !== undefined || raw !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  let data;
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

export async function login(config, name, password) {
  const response = await request(config, 'POST', '/api/auth/login', {
    json: { username: name, password },
  });
  if (response.status !== 200) {
    throw new Error(`login ${name}: ${response.status} ${JSON.stringify(response.data)}`);
  }
  return String(response.data.token);
}

export async function register(config, name, password) {
  const response = await request(config, 'POST', '/api/auth/register', {
    json: { username: name, password },
  });
  if (response.status !== 201) {
    throw new Error(`register ${name}: ${response.status} ${JSON.stringify(response.data)}`);
  }
  return String(response.data.token);
}

export async function deleteAccount(config, token) {
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
export async function deleteAccountQuietly(config, name, password) {
  try {
    await deleteAccount(config, await login(config, name, password));
  } catch {
    // stand unreachable / user never created — nothing to clean
  }
}
