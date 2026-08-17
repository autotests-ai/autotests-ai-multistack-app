import type { HeaderConfig } from '@zero-design-system/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { envNavItems, PROD_ORIGIN, PUBLIC_HOST, STAGE_ORIGIN } from '../../../../_shared/env-hosts';

// Canonical design-system header from lean runtime (committed; works in
// standalone checkout without monorepo design-system symlink).
const { HEADER_JS, TEMPLATE_HTML } = vi.hoisted(() => {
  const { readFileSync: read } = require('node:fs') as typeof import('node:fs');
  const { resolve: res } = require('node:path') as typeof import('node:path');
  const runtime = res(__dirname, '../../../../_shared/frontend-javascript-app');
  return {
    HEADER_JS: res(runtime, 'js/header.js'),
    TEMPLATE_HTML: read(res(runtime, 'templates/header.html'), 'utf8'),
  };
});

// String literal required — vi.mock is hoisted.
vi.mock('../../../../_shared/frontend-javascript-app/js/dom-utils.js', () => ({
  fetchTemplateText: vi.fn(async () => TEMPLATE_HTML),
  escapeHtml: (v: string) => v,
  copyToClipboard: vi.fn(),
}));

const MOUNT = '/frontend-typescript-react';

const REFERENCE_HEADER_CONFIG: HeaderConfig = {
  brand: { href: `${MOUNT}/`, label: 'Multistack' },
  nav: [
    { href: `${MOUNT}/`, label: 'Home', active: false, testid: 'header-nav-home' },
    { href: `${MOUNT}/login`, label: 'Login', active: false, testid: 'header-nav-login' },
    {
      href: `${MOUNT}/register`,
      label: 'Register',
      active: false,
      testid: 'header-nav-register',
    },
    {
      href: '/stack/',
      label: 'Stack',
      active: false,
      testid: 'header-nav-stack',
    },
    ...envNavItems(),
  ],
  lang: { default: 'en' as const },
  theme: { default: 'dark' as const },
};

function navLinks(): HTMLAnchorElement[] {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-testid="header-nav"] a'));
}

function menuNavLinks(): HTMLAnchorElement[] {
  return Array.from(
    document.querySelectorAll<HTMLAnchorElement>('[data-testid="header-menu-nav"] a'),
  );
}

function activeTestids(): (string | undefined)[] {
  return navLinks()
    .filter((a) => a.classList.contains('is-active'))
    .map((a) => a.dataset.testid);
}

function activeMenuTestids(): (string | undefined)[] {
  return menuNavLinks()
    .filter((a) => a.classList.contains('is-active'))
    .map((a) => a.dataset.testid);
}

function ariaCurrentTestids(): (string | undefined)[] {
  return navLinks()
    .filter((a) => a.getAttribute('aria-current') === 'page')
    .map((a) => a.dataset.testid);
}

async function mountAt(path: string): Promise<void> {
  window.history.replaceState({}, '', path);
  document.body.innerHTML = '<div id="app-header"></div>';
  (window as unknown as { headerConfig: unknown }).headerConfig =
    structuredClone(REFERENCE_HEADER_CONFIG);
  vi.resetModules();
  await import(/* @vite-ignore */ HEADER_JS);
  await vi.waitFor(() => {
    expect(navLinks().length).toBe(6);
    expect(menuNavLinks().length).toBe(6);
  });
}

function mockMobileViewport(): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width: 767px'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('canonical header.js — active nav follows the route', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', `${MOUNT}/`);
    document.documentElement.className = '';
    mockMobileViewport();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('highlights Login on a direct /login load', async () => {
    await mountAt(`${MOUNT}/login`);
    expect(activeTestids()).toEqual(['header-nav-login']);
    expect(ariaCurrentTestids()).toEqual(['header-nav-login']);
  });

  it('highlights Register on a direct /register load', async () => {
    await mountAt(`${MOUNT}/register`);
    expect(activeTestids()).toEqual(['header-nav-register']);
    expect(ariaCurrentTestids()).toEqual(['header-nav-register']);
  });

  it('highlights Home on mount root', async () => {
    await mountAt(`${MOUNT}/`);
    expect(activeTestids()).toEqual(['header-nav-home']);
    expect(ariaCurrentTestids()).toEqual(['header-nav-home']);
  });

  it('highlights Stack on the /stack/ board', async () => {
    await mountAt('/stack/');
    expect(activeTestids()).toEqual(['header-nav-stack']);
    expect(ariaCurrentTestids()).toEqual(['header-nav-stack']);
  });

  it('re-syncs on SPA pushState (in-form Register → Login link)', async () => {
    await mountAt(`${MOUNT}/register`);
    expect(activeTestids()).toEqual(['header-nav-register']);

    window.history.pushState({}, '', `${MOUNT}/login`);

    await vi.waitFor(() => {
      expect(activeTestids()).toEqual(['header-nav-login']);
    });
    expect(ariaCurrentTestids()).toEqual(['header-nav-login']);
  });

  it('re-syncs on popstate (browser back/forward)', async () => {
    await mountAt(`${MOUNT}/login`);
    window.history.replaceState({}, '', `${MOUNT}/register`);
    window.dispatchEvent(new PopStateEvent('popstate'));

    await vi.waitFor(() => {
      expect(activeTestids()).toEqual(['header-nav-register']);
    });
    expect(ariaCurrentTestids()).toEqual(['header-nav-register']);
  });

  it('keeps aria-current on exactly one item after navigation', async () => {
    await mountAt(`${MOUNT}/`);
    window.history.pushState({}, '', `${MOUNT}/register`);
    await vi.waitFor(() => {
      expect(ariaCurrentTestids()).toEqual(['header-nav-register']);
    });
  });
});

describe('canonical header.js — mobile burger menu', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', `${MOUNT}/`);
    document.documentElement.className = '';
    mockMobileViewport();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('builds menu with nav, search, and github links', async () => {
    await mountAt(`${MOUNT}/`);

    expect(document.querySelector('[data-testid="header-menu"]')).not.toBeNull();
    expect(menuNavLinks().map((a) => a.dataset.testid)).toEqual([
      'header-menu-nav-home',
      'header-menu-nav-login',
      'header-menu-nav-register',
      'header-menu-nav-stack',
      'header-menu-nav-stage',
      'header-menu-nav-prod',
    ]);
    expect(document.querySelector('[data-testid="header-menu-search-input"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="header-menu-github"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="header-menu-github-pages"]')).not.toBeNull();
  });

  it('toggles menu visibility via burger button', async () => {
    await mountAt(`${MOUNT}/`);

    const burger = document.querySelector<HTMLButtonElement>('[data-testid="header-burger"]');
    const menu = document.querySelector<HTMLElement>('[data-testid="header-menu"]');
    expect(burger).not.toBeNull();
    expect(menu).not.toBeNull();
    expect(menu?.hidden).toBe(true);
    expect(burger?.getAttribute('aria-expanded')).toBe('false');

    burger?.click();
    expect(menu?.hidden).toBe(false);
    expect(burger?.getAttribute('aria-expanded')).toBe('true');

    burger?.click();
    expect(menu?.hidden).toBe(true);
    expect(burger?.getAttribute('aria-expanded')).toBe('false');
  });

  it('highlights the active route in menu nav links', async () => {
    await mountAt(`${MOUNT}/login`);
    expect(activeMenuTestids()).toEqual(['header-menu-nav-login']);
  });

  it('closes menu when a menu nav link is clicked', async () => {
    await mountAt(`${MOUNT}/`);

    const burger = document.querySelector<HTMLButtonElement>('[data-testid="header-burger"]');
    const menu = document.querySelector<HTMLElement>('[data-testid="header-menu"]');
    burger?.click();
    expect(menu?.hidden).toBe(false);

    menuNavLinks()[0]?.click();
    expect(menu?.hidden).toBe(true);
  });
});

describe('env-hosts — matrix public_host', () => {
  it('derives Stage/Prod origins from public_host', () => {
    expect(PROD_ORIGIN).toBe(`https://${PUBLIC_HOST}`);
    expect(STAGE_ORIGIN).toBe(`https://stage.${PUBLIC_HOST}`);
    expect(envNavItems().map((item) => item.testid)).toEqual([
      'header-nav-stage',
      'header-nav-prod',
    ]);
  });
});

describe('canonical header.js — host-match env switchers', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', `${MOUNT}/`);
    document.documentElement.className = '';
    mockMobileViewport();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('rewrites Stage/Prod hrefs to the current path without stealing page active', async () => {
    await mountAt(`${MOUNT}/login`);

    expect(activeTestids()).toEqual(['header-nav-login']);
    expect(ariaCurrentTestids()).toEqual(['header-nav-login']);

    const stage = document.querySelector<HTMLAnchorElement>('[data-testid="header-nav-stage"]');
    const prod = document.querySelector<HTMLAnchorElement>('[data-testid="header-nav-prod"]');
    expect(stage?.getAttribute('href')).toBe(`${STAGE_ORIGIN}${MOUNT}/login`);
    expect(prod?.getAttribute('href')).toBe(`${PROD_ORIGIN}${MOUNT}/login`);
    expect(stage?.classList.contains('is-active')).toBe(false);
    expect(prod?.classList.contains('is-active')).toBe(false);
  });

  it('marks the host-match item active when hostname matches', async () => {
    await mountAt(`${MOUNT}/`);

    const config = structuredClone(REFERENCE_HEADER_CONFIG);
    config.nav = [
      ...(config.nav ?? []).filter((item) => item.match !== 'host'),
      {
        href: `${window.location.origin}/`,
        label: 'Here',
        testid: 'header-nav-here',
        match: 'host' as const,
      },
    ];
    document.body.innerHTML = '<div id="app-header"></div>';
    (window as unknown as { headerConfig: unknown }).headerConfig = config;
    vi.resetModules();
    await import(/* @vite-ignore */ HEADER_JS);
    await vi.waitFor(() => {
      expect(document.querySelector('[data-testid="header-nav-here"]')).not.toBeNull();
    });

    const here = document.querySelector<HTMLAnchorElement>('[data-testid="header-nav-here"]');
    expect(here?.classList.contains('is-active')).toBe(true);
    expect(here?.getAttribute('aria-current')).toBe('true');
    expect(activeTestids()).toEqual(['header-nav-home', 'header-nav-here']);
  });

  it('updates host-match hrefs on SPA pushState', async () => {
    await mountAt(`${MOUNT}/`);
    window.history.pushState({}, '', `${MOUNT}/register`);

    await vi.waitFor(() => {
      const stage = document.querySelector<HTMLAnchorElement>('[data-testid="header-nav-stage"]');
      expect(stage?.getAttribute('href')).toBe(`${STAGE_ORIGIN}${MOUNT}/register`);
    });
    expect(activeTestids()).toEqual(['header-nav-register']);
  });
});
