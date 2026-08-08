import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Canonical design-system header from lean runtime (committed; works in
// standalone checkout without monorepo design-system symlink).
const { HEADER_JS, TEMPLATE_HTML } = vi.hoisted(() => {
  const { readFileSync: read } = require('node:fs');
  const { resolve: res } = require('node:path');
  const runtime = res(__dirname, '../../../../_shared/frontend-javascript-app');
  return {
    HEADER_JS: res(runtime, 'js/header.js'),
    TEMPLATE_HTML: read(res(runtime, 'templates/header.html'), 'utf8'),
  };
});

// String literal required — vi.mock is hoisted.
vi.mock('../../../../_shared/frontend-javascript-app/js/dom-utils.js', () => ({
  fetchTemplateText: vi.fn(async () => TEMPLATE_HTML),
  escapeHtml: (v) => v,
  copyToClipboard: vi.fn(),
}));

const MOUNT = '/frontend-javascript-react';

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
  // The REAL app config (not an inline copy): resetModules makes appBase re-resolve
  // the mount from the location set above, so config drift fails this test.
  vi.resetModules();
  const { headerConfig } = await import('../lib/headerConfig');
  window.headerConfig = structuredClone(headerConfig);
  await import(/* @vite-ignore */ HEADER_JS);
  await vi.waitFor(() => {
    expect(navLinks().length).toBe(3);
    expect(menuNavLinks().length).toBe(3);
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
    ]);
    expect(document.querySelector('[data-testid="header-menu-search-input"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="header-menu-github"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="header-menu-github-pages"]')).not.toBeNull();
  });

  it('toggles menu visibility via burger button', async () => {
    await mountAt(`${MOUNT}/`);

    const burger = document.querySelector('[data-testid="header-burger"]');
    const menu = document.querySelector('[data-testid="header-menu"]');
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

    const burger = document.querySelector('[data-testid="header-burger"]');
    const menu = document.querySelector('[data-testid="header-menu"]');
    burger?.click();
    expect(menu?.hidden).toBe(false);

    menuNavLinks()[0]?.click();
    expect(menu?.hidden).toBe(true);
  });
});
