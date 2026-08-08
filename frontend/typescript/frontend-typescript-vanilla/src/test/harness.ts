import { type Mock, vi } from 'vitest';
import indexHtml from '../../index.html?raw';
import loginHtml from '../../login.html?raw';
import registerHtml from '../../register.html?raw';

const PAGES = {
  'index.html': indexHtml,
  'login.html': loginHtml,
  'register.html': registerHtml,
};

export type PageFile = keyof typeof PAGES;

/**
 * Mount the body of a shipped document. There is no component framework here,
 * so the tests run against the real HTML instead of a hand-copied fixture that
 * could drift from it. The page module is imported by the test itself, so the
 * `<script>` tags are dropped.
 */
export function loadPage(file: PageFile): void {
  const body = /<body>([\s\S]*)<\/body>/.exec(PAGES[file]);
  if (!body) {
    throw new Error(`${file}: no <body> to mount`);
  }
  document.body.innerHTML = body[1].replace(/<script\b[\s\S]*?<\/script>/g, '');
}

export interface LocationStub {
  href: string;
  pathname: string;
  replace: Mock<(url: string) => void>;
}

let realLocation: Location | undefined;

/** jsdom refuses real navigation, so `location` is swapped for an observable stub. */
export function stubLocation(pathname = '/'): LocationStub {
  realLocation ??= window.location;
  const stub: LocationStub = { href: '', pathname, replace: vi.fn() };
  Object.defineProperty(window, 'location', { value: stub, configurable: true, writable: true });
  return stub;
}

export function restoreLocation(): void {
  if (realLocation) {
    Object.defineProperty(window, 'location', {
      value: realLocation,
      configurable: true,
      writable: true,
    });
  }
}

export function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

const NO_CONTENT = { ok: true, status: 204, json: async () => ({}) } as Response;

export type FetchOverride = (
  url: string,
  init?: RequestInit,
) => Response | Promise<Response> | null;

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

/** Happy-path reference backend; `overrides` returns a Response to take over a call. */
export function stubReferenceApi(overrides?: FetchOverride): void {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const override = overrides?.(url, init);
      if (override) {
        return Promise.resolve(override);
      }

      if (url.includes('/api/health')) {
        return Promise.resolve(jsonResponse({ status: 'UP', service: 'reference-app' }));
      }
      if (url.includes('/api/items')) {
        return Promise.resolve(
          jsonResponse({ items: [{ id: 1, name: 'Alpha', description: 'First item' }] }),
        );
      }
      if (url.includes('/api/auth/me') && init?.method === 'DELETE') {
        return Promise.resolve(NO_CONTENT);
      }
      if (url.includes('/api/auth/me')) {
        return Promise.resolve(jsonResponse({ username: 'user1' }));
      }
      if (url.includes('/api/auth/logout')) {
        return Promise.resolve(NO_CONTENT);
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    }),
  );
}

export function fetchCalls(path: string, method?: string) {
  return (globalThis.fetch as unknown as FetchMock).mock.calls.filter(
    ([input, init]) => String(input).includes(path) && (!method || init?.method === method),
  );
}

/** Poll until `assert` stops throwing — the page modules load their data async. */
export async function waitFor(assert: () => void, timeout = 1000): Promise<void> {
  const deadline = Date.now() + timeout;
  for (;;) {
    try {
      assert();
      return;
    } catch (error) {
      if (Date.now() > deadline) {
        throw error;
      }
      await new Promise((done) => setTimeout(done, 5));
    }
  }
}

/**
 * Yield past everything a click handler awaits. Needed to prove a *negative*:
 * `waitFor` cannot tell "never happens" from "has not happened yet".
 */
export async function settle(): Promise<void> {
  for (let i = 0; i < 3; i += 1) {
    await new Promise((done) => setTimeout(done, 0));
  }
}

export function testId<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.querySelector<T>(`[data-testid="${id}"]`);
  if (!element) {
    throw new Error(`no element with data-testid="${id}"`);
  }
  return element;
}
