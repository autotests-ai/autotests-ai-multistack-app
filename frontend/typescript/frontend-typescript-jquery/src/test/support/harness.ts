import { expect, type Mock, vi } from 'vitest';
import indexHtml from '../../../index.html?raw';
import loginHtml from '../../../login.html?raw';
import registerHtml from '../../../register.html?raw';

export type DocumentName = 'index.html' | 'login.html' | 'register.html';

const DOCUMENTS: Record<DocumentName, string> = {
  'index.html': indexHtml,
  'login.html': loginHtml,
  'register.html': registerHtml,
};

/** Mount the shipped document body, so specs run against the real markup. */
export function mountDocument(name: DocumentName): void {
  const body = /<body>([\s\S]*)<\/body>/.exec(DOCUMENTS[name]);
  if (!body) {
    throw new Error(`${name} has no <body> to mount`);
  }
  document.body.innerHTML = body[1];
}

/** The page entries run inside jQuery's ready block, which mounts the header first. */
export async function waitForPageReady(): Promise<void> {
  await vi.waitFor(() => {
    expect(document.querySelector('script[data-header-embed]')).not.toBeNull();
  });
}

export interface LocationStub {
  href: string;
  pathname: string;
  replace: Mock<(url: string) => void>;
}

const REAL_LOCATION = Object.getOwnPropertyDescriptor(window, 'location');

/**
 * jsdom implements no navigation, and these pages navigate the way a multi-page app
 * does — by assigning `window.location.href` / calling `replace`.
 */
export function stubLocation(pathname = '/'): LocationStub {
  const stub: LocationStub = {
    href: `http://localhost${pathname}`,
    pathname,
    replace: vi.fn(),
  };
  Object.defineProperty(window, 'location', { configurable: true, writable: true, value: stub });
  return stub;
}

export function restoreLocation(): void {
  if (REAL_LOCATION) {
    Object.defineProperty(window, 'location', REAL_LOCATION);
  }
}

export function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

/** Return a canned response to take over one endpoint, or null to keep the default. */
export type FetchOverride = (url: string, init?: RequestInit) => Response | null;

export function stubApis(overrides?: FetchOverride): void {
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
      if (url.includes('/api/auth/login')) {
        return Promise.resolve(
          jsonResponse({ token: 'jwt-login', username: 'user1', redirectUrl: '/' }),
        );
      }
      if (url.includes('/api/auth/register')) {
        return Promise.resolve(
          jsonResponse({ token: 'jwt-register', username: 'user1', redirectUrl: '/' }, true, 201),
        );
      }
      if (url.includes('/api/auth/logout')) {
        return Promise.resolve(jsonResponse({}, true, 204));
      }
      if (url.includes('/api/auth/me')) {
        return Promise.resolve(
          init?.method === 'DELETE' ? jsonResponse({}, true, 204) : jsonResponse({ username: 'user1' }),
        );
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    }),
  );
}

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

/** Requests the page actually sent, filtered by method and path. */
export function fetchCalls(method: string, path: string) {
  return (globalThis.fetch as unknown as FetchMock).mock.calls.filter(
    ([input, init]) => String(input).includes(path) && (init?.method ?? 'GET') === method,
  );
}
