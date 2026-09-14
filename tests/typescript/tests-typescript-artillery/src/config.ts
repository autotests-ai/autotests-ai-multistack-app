/**
 * Stand + injection knobs for official artillery.io (native TypeScript, not tsc).
 * Seed user matches testdata-user: user1 / password1.
 */

function firstNonBlank(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    if (value != null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function parseIntOr(raw: string, fallback: number): number {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function env(): { [key: string]: string | undefined } {
  return typeof process !== 'undefined' && process.env ? process.env : {};
}

export function apiBaseUrl(): string {
  const e = env();
  return stripTrailingSlash(
    firstNonBlank(e.API_BASE_URL, e.apiBaseUrl, 'http://localhost:8800'),
  );
}

export function username(): string {
  const e = env();
  return firstNonBlank(e.LOAD_USERNAME, e.username, 'user1');
}

export function password(): string {
  const e = env();
  return firstNonBlank(e.LOAD_PASSWORD, e.password, 'password1');
}

export function profile(): string {
  return firstNonBlank(env().ARTILLERY_PROFILE, 'smoke').toLowerCase();
}

export function rps(): number {
  return Math.max(1, parseIntOr(firstNonBlank(env().LOAD_RPS, '1'), 1));
}

export function duringSeconds(): number {
  return Math.max(1, parseIntOr(firstNonBlank(env().LOAD_DURING_SECONDS, '25'), 25));
}

export function allowPublic(): boolean {
  return firstNonBlank(env().ARTILLERY_ALLOW_PUBLIC, 'false').toLowerCase() === 'true';
}

export function jsonHeaders(): { [name: string]: string } {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'tests-typescript-artillery',
  };
}

export function refuseSharedProd(baseUrl: string): void {
  const lower = baseUrl.toLowerCase();
  const shared = lower.includes('autotests.ai') || lower.includes('qa.guru');
  if (shared && !allowPublic()) {
    throw new Error(
      `Refusing ${baseUrl} — isolated SUT only. Pass ARTILLERY_ALLOW_PUBLIC=true when the host is a dedicated load stand.`,
    );
  }
}
