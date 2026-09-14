/**
 * Stand + injection knobs for official artillery.io (YAML + processor.js).
 * Seed user matches testdata-user: user1 / password1.
 */

function firstNonBlank() {
  for (let i = 0; i < arguments.length; i += 1) {
    const value = arguments[i];
    if (value != null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function stripTrailingSlash(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function parseIntOr(raw, fallback) {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function env() {
  return typeof process !== 'undefined' && process.env ? process.env : {};
}

function apiBaseUrl() {
  const e = env();
  return stripTrailingSlash(
    firstNonBlank(e.API_BASE_URL, e.apiBaseUrl, 'http://localhost:8800'),
  );
}

function username() {
  const e = env();
  return firstNonBlank(e.LOAD_USERNAME, e.username, 'user1');
}

function password() {
  const e = env();
  return firstNonBlank(e.LOAD_PASSWORD, e.password, 'password1');
}

function profile() {
  return firstNonBlank(env().ARTILLERY_PROFILE, 'smoke').toLowerCase();
}

function rps() {
  return Math.max(1, parseIntOr(firstNonBlank(env().LOAD_RPS, '1'), 1));
}

function duringSeconds() {
  return Math.max(1, parseIntOr(firstNonBlank(env().LOAD_DURING_SECONDS, '25'), 25));
}

function allowPublic() {
  return firstNonBlank(env().ARTILLERY_ALLOW_PUBLIC, 'false').toLowerCase() === 'true';
}

function jsonHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'tests-javascript-artillery',
  };
}

function refuseSharedProd(baseUrl) {
  const lower = baseUrl.toLowerCase();
  const shared = lower.includes('autotests.ai') || lower.includes('qa.guru');
  if (shared && !allowPublic()) {
    throw new Error(
      `Refusing ${baseUrl} — isolated SUT only. Pass ARTILLERY_ALLOW_PUBLIC=true when the host is a dedicated load stand.`,
    );
  }
}

module.exports = {
  apiBaseUrl,
  username,
  password,
  profile,
  rps,
  duringSeconds,
  allowPublic,
  jsonHeaders,
  refuseSharedProd,
};
