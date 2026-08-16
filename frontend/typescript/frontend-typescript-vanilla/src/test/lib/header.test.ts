import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { headerConfigFor, mountHeader } from '../../header';
import { restoreLocation, stubLocation } from '../harness';

/** The mount is resolved once at appBase import, so a new mount needs a new module. */
async function headerAt(pathname: string) {
  stubLocation(pathname);
  vi.resetModules();
  return await import('../../header');
}

describe('headerConfigFor', () => {
  beforeEach(() => {
    stubLocation('/');
  });

  afterEach(() => {
    restoreLocation();
    vi.resetModules();
  });

  it('carries the nav testids the Selenide header page object needs', () => {
    expect(headerConfigFor('/').nav.map((item) => item.testid)).toEqual([
      'header-nav-home',
      'header-nav-login',
      'header-nav-register',
      'header-nav-stack',
    ]);
  });

  it('marks exactly one nav item active per page', () => {
    const active = (route: '/' | '/login' | '/register') =>
      headerConfigFor(route)
        .nav.filter((item) => item.active)
        .map((item) => item.label);

    expect(active('/')).toEqual(['Home']);
    expect(active('/login')).toEqual(['Login']);
    expect(active('/register')).toEqual(['Register']);
  });

  it('serves bare paths at the document root', () => {
    expect(headerConfigFor('/').nav.map((item) => item.href)).toEqual([
      '/',
      '/login',
      '/register',
      '/stack/',
    ]);
  });

  it('prefixes nav hrefs with the product mount', async () => {
    const header = await headerAt(
      '/stack/backend-java-spring/frontend-typescript-vanilla/login',
    );

    expect(header.headerConfigFor('/login').nav.map((item) => item.href)).toEqual([
      '/stack/backend-java-spring/frontend-typescript-vanilla/',
      '/stack/backend-java-spring/frontend-typescript-vanilla/login',
      '/stack/backend-java-spring/frontend-typescript-vanilla/register',
      '/stack/',
    ]);
  });
});

describe('mountHeader', () => {
  beforeEach(() => {
    stubLocation('/');
    document.body.innerHTML = '<div id="app-header"></div>';
    window.headerConfig = undefined;
  });

  afterEach(() => {
    restoreLocation();
    vi.resetModules();
  });

  it('publishes headerConfig and embeds the overlay header runtime once', () => {
    mountHeader('/login');
    mountHeader('/login');

    expect(window.headerConfig?.brand).toEqual({ href: '/', label: 'Multistack' });

    const embeds = document.querySelectorAll<HTMLScriptElement>('script[data-header-embed]');
    expect(embeds).toHaveLength(1);
    expect(embeds[0].type).toBe('module');
    expect(embeds[0].getAttribute('src')).toBe('/js/header.js');
  });

  // The embed URL must carry the mount: header.js resolves its own template
  // relative to its script URL (`../templates/header.html`).
  it('embeds the runtime under the product mount', async () => {
    const header = await headerAt('/stack/backend-java-spring/frontend-typescript-vanilla/');
    document.body.innerHTML = '<div id="app-header"></div>';

    header.mountHeader('/');

    expect(document.querySelector('script[data-header-embed]')?.getAttribute('src')).toBe(
      '/stack/backend-java-spring/frontend-typescript-vanilla/js/header.js',
    );
  });
});
