import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Canonical design-system header from the lean runtime (committed; works in a
// standalone checkout without the monorepo design-system symlink). String literal
// required — vi.mock is hoisted, so the factory stays self-contained.
vi.mock('../../vendor/ds/js/dom-utils.js', async () => {
  const { readFileSync } = await import('node:fs');
  const { resolve: res } = await import('node:path');
  const runtime = res(import.meta.dirname, '../../vendor/ds');
  const template = readFileSync(res(runtime, 'templates/header.html'), 'utf8');
  return {
    fetchTemplateText: vi.fn(async () => template),
    escapeHtml: (v) => v,
    copyToClipboard: vi.fn(),
  };
});

const RUNTIME_DIR = resolve(import.meta.dirname, '../../vendor/ds');
const HEADER_JS = resolve(RUNTIME_DIR, 'js/header.js');

const MOUNT = '/frontend-javascript-angular';

const REFERENCE_HEADER_CONFIG = {
  brand: { href: `${MOUNT}/`, label: 'Multistack' },
  nav: [
    { href: `${MOUNT}/`, label: 'Home', active: false, testid: 'header-nav-home' },
    { href: `${MOUNT}/login`, label: 'Login', active: false, testid: 'header-nav-login' },
    { href: `${MOUNT}/register`, label: 'Register', active: false, testid: 'header-nav-register' },
    { href: '/stack/', label: 'Stack', active: false, testid: 'header-nav-stack' },
  ],
  lang: { default: 'en' },
  theme: { default: 'dark' },
};

function navLinks() {
  return Array.from(document.querySelectorAll('[data-testid="header-nav"] a'));
}

function menuNavLinks() {
  return Array.from(document.querySelectorAll('[data-testid="header-menu-nav"] a'));
}

function activeTestids() {
  return navLinks()
    .filter((a) => a.classList.contains('is-active'))
    .map((a) => a.dataset.testid);
}

function activeMenuTestids() {
  return menuNavLinks()
    .filter((a) => a.classList.contains('is-active'))
    .map((a) => a.dataset.testid);
}

function ariaCurrentTestids() {
  return navLinks()
    .filter((a) => a.getAttribute('aria-current') === 'page')
    .map((a) => a.dataset.testid);
}

async function mountAt(path) {
  window.history.replaceState({}, '', path);
  document.body.innerHTML = '<div id="app-header"></div>';
  window.headerConfig = structuredClone(REFERENCE_HEADER_CONFIG);
  vi.resetModules();
  await import(/* @vite-ignore */ HEADER_JS);
  await vi.waitFor(() => {
    expect(navLinks().length).toBe(4);
    expect(menuNavLinks().length).toBe(4);
  });
}

function mockMobileViewport() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query) => ({
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
    ]);
    expect(document.querySelector('[data-testid="header-menu-search-input"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="header-menu-github"]')).not.toBeNull();
  });

  it('toggles menu visibility via burger button', async () => {
    await mountAt(`${MOUNT}/`);

    const burger = document.querySelector('[data-testid="header-burger"]');
    const menu = document.querySelector('[data-testid="header-menu"]');
    expect(burger).not.toBeNull();
    expect(menu).not.toBeNull();
    expect(menu.hidden).toBe(true);
    expect(burger.getAttribute('aria-expanded')).toBe('false');

    burger.click();
    expect(menu.hidden).toBe(false);
    expect(burger.getAttribute('aria-expanded')).toBe('true');

    burger.click();
    expect(menu.hidden).toBe(true);
    expect(burger.getAttribute('aria-expanded')).toBe('false');
  });

  it('highlights the active route in menu nav links', async () => {
    await mountAt(`${MOUNT}/login`);
    expect(activeMenuTestids()).toEqual(['header-menu-nav-login']);
  });
});
