const { faker } = require('@faker-js/faker');
const { apiRoot } = require('./env');

const WRONG_CREDENTIALS_MESSAGE = 'Wrong login or password';

function username() {
  return `user_${faker.string.alphanumeric(10)}`;
}

async function apiRequest(method, path, { token, json, raw } = {}) {
  const headers = {};
  if (json !== undefined || raw !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  let body;
  if (raw !== undefined) {
    body = raw;
  } else if (json !== undefined) {
    body = JSON.stringify(json);
  }
  return fetch(`${apiRoot()}${path}`, { method, headers, body });
}

async function loginToken(name, password) {
  const response = await apiRequest('POST', '/api/auth/login', {
    json: { username: name, password },
  });
  if (!response.ok) {
    throw new Error(`login ${name}: ${response.status}`);
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
    const root = apiRoot();
    const login = await request.post(`${root}/api/auth/login`, {
      data: { username, password },
    });
    if (!login.ok()) {
      return;
    }
    const { token } = await login.json();
    await request.delete(`${root}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // stand unreachable / user never created — nothing to clean
  }
}

module.exports = {
  WRONG_CREDENTIALS_MESSAGE,
  username,
  apiRequest,
  loginToken,
  deleteAccountQuietly,
};
