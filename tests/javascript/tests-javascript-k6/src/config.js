/**
 * Stand + injection knobs for Grafana k6 (runtime JavaScript, not Node).
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

function jsonEscape(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function apiBaseUrl() {
  return stripTrailingSlash(
    firstNonBlank(__ENV.API_BASE_URL, __ENV.apiBaseUrl, 'http://localhost:8800'),
  );
}

export function username() {
  return firstNonBlank(__ENV.LOAD_USERNAME, __ENV.username, 'user1');
}

export function password() {
  return firstNonBlank(__ENV.LOAD_PASSWORD, __ENV.password, 'password1');
}

export function profile() {
  return firstNonBlank(__ENV.K6_PROFILE, 'smoke').toLowerCase();
}

export function users() {
  return Math.max(1, parseIntOr(firstNonBlank(__ENV.LOAD_VUS, '1'), 1));
}

export function duringSeconds() {
  return Math.max(1, parseIntOr(firstNonBlank(__ENV.LOAD_DURING_SECONDS, '30'), 30));
}

export function p95Ms() {
  return Math.max(1, parseIntOr(firstNonBlank(__ENV.LOAD_P95_MS, '2000'), 2000));
}

export function allowPublic() {
  return firstNonBlank(__ENV.K6_ALLOW_PUBLIC, 'false').toLowerCase() === 'true';
}

export function loginJson() {
  return `{"username":"${jsonEscape(username())}","password":"${jsonEscape(password())}"}`;
}

export function jsonHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'tests-javascript-k6',
  };
}

export function refuseSharedProd(baseUrl) {
  const lower = baseUrl.toLowerCase();
  const shared = lower.includes('autotests.ai') || lower.includes('qa.guru');
  if (shared && !allowPublic()) {
    throw new Error(
      `Refusing ${baseUrl} — isolated SUT only. Pass K6_ALLOW_PUBLIC=true when the host is a dedicated load stand.`,
    );
  }
}

export function loadOptions() {
  const p95 = p95Ms();
  const thresholds = {
    http_req_failed: ['rate<0.01'],
    http_req_duration: [`p(95)<${p95}`],
  };
  if (profile() === 'load') {
    const vus = users();
    const hold = duringSeconds();
    return {
      thresholds,
      scenarios: {
        'auth-api': {
          executor: 'ramping-vus',
          startVUs: 0,
          gracefulStop: '5s',
          stages: [
            { duration: '10s', target: vus },
            { duration: `${hold}s`, target: vus },
          ],
        },
      },
    };
  }
  return {
    thresholds,
    vus: 1,
    iterations: 1,
  };
}
