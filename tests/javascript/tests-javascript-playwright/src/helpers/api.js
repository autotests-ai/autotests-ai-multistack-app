const { apiRoot } = require('./env');

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

module.exports = { deleteAccountQuietly };
