const { faker } = require('@faker-js/faker');
const { apiRoot } = require('./env');

const WRONG_CREDENTIALS_MESSAGE = 'Wrong login or password';

function username() {
  return `user_${faker.string.alphanumeric(10)}`;
}

function usernameAtMinLength() {
  return faker.string.alphanumeric(3).toLowerCase();
}

function passwordAtMinLength() {
  return '123456';
}

/**
 * Product HTTP via Playwright APIRequestContext — not `fetch`, not Axios.
 * Absolute URL from apiRoot(): the request fixture's baseURL is the UI origin.
 *
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} method
 * @param {string} path
 * @param {{ token?: string, json?: unknown, raw?: string }} [opts]
 * @returns {Promise<import('@playwright/test').APIResponse>}
 */
async function apiRequest(request, method, path, { token, json, raw } = {}) {
  const headers = {};
  if (json !== undefined || raw !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const url = `${apiRoot()}${path}`;
  const options = { headers };
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

/**
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} name
 * @param {string} password
 * @returns {Promise<string>}
 */
async function loginToken(request, name, password) {
  const response = await apiRequest(request, 'POST', '/api/auth/login', {
    json: { username: name, password },
  });
  if (!response.ok()) {
    throw new Error(`login ${name}: ${response.status()}`);
  }
  const body = await response.json();
  if (!body.token) {
    throw new Error(`login ${name}: no token`);
  }
  return body.token;
}

/**
 * Cleanup through the product API: log in as the user the test registered and delete the
 * account (DELETE /api/auth/me), so the stand does not accumulate user_* rows.
 * Best-effort by design — a failed cleanup must not mask the test's own result.
 *
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} username
 * @param {string} password
 */
async function deleteAccountQuietly(request, username, password) {
  try {
    const login = await apiRequest(request, 'POST', '/api/auth/login', {
      json: { username, password },
    });
    if (!login.ok()) {
      return;
    }
    const { token } = await login.json();
    if (!token) {
      return;
    }
    await apiRequest(request, 'DELETE', '/api/auth/me', { token });
  } catch {
    // stand unreachable / user never created — nothing to clean
  }
}

module.exports = {
  WRONG_CREDENTIALS_MESSAGE,
  username,
  usernameAtMinLength,
  passwordAtMinLength,
  apiRequest,
  loginToken,
  deleteAccountQuietly,
};
