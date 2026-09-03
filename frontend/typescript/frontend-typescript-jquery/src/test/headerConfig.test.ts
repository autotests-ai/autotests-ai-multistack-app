import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HEADER_LANG_CHANGE, ru } from '../i18n';
import { restoreLocation, stubLocation } from './support/harness';

/** The mount is resolved once at appBase import, so a new mount needs a new module. */
async function headerAt(pathname: string) {
  stubLocation(pathname);
  vi.resetModules();
  return await import('../headerConfig');
}

describe('buildHeaderConfig', () => {
  beforeEach(() => {
    localStorage.clear();
    stubLocation('/');
  });

  afterEach(() => {
    restoreLocation();
    vi.resetModules();
  });

  it('keeps testids and hrefs stable across en/ru and only changes labels', async () => {
    const { buildHeaderConfig, STACK_INDEX_HREF } = await import('../headerConfig');
    const enCfg = buildHeaderConfig('home', 'en');
    const ruCfg = buildHeaderConfig('home', 'ru');

    expect(enCfg.nav.map((item) => item.testid)).toEqual(ruCfg.nav.map((item) => item.testid));
    expect(enCfg.nav.map((item) => item.href)).toEqual(ruCfg.nav.map((item) => item.href));
    expect(enCfg.nav.find((item) => item.testid === 'header-nav-home')?.label).toBe('Home');
    expect(ruCfg.nav.find((item) => item.testid === 'header-nav-home')?.label).toBe(ru.nav.home);
    expect(enCfg.nav.find((item) => item.testid === 'header-nav-stack')?.href).toBe(STACK_INDEX_HREF);
    expect(enCfg.nav.find((item) => item.testid === 'header-nav-stage')?.label).toBe('Stage');
    expect(enCfg.nav.find((item) => item.testid === 'header-nav-prod')?.label).toBe('Prod');
    expect(enCfg.lang).toEqual({ default: 'en' });
    expect(enCfg.theme).toEqual({ default: 'dark' });
  });

  it('marks exactly one nav item active per page', async () => {
    const { buildHeaderConfig } = await import('../headerConfig');
    const active = (current: 'home' | 'login' | 'register') =>
      buildHeaderConfig(current)
        .nav.filter((item) => item.active)
        .map((item) => item.label);

    expect(active('home')).toEqual(['Home']);
    expect(active('login')).toEqual(['Login']);
    expect(active('register')).toEqual(['Register']);
  });
});

describe('mountHeader', () => {
  beforeEach(() => {
    localStorage.clear();
    stubLocation('/');
    document.body.innerHTML = '<div id="app-header"></div>';
    window.headerConfig = undefined;
    delete window.__designSystemRemountHeader;
  });

  afterEach(() => {
    restoreLocation();
    vi.resetModules();
    delete window.headerConfig;
    delete window.__designSystemRemountHeader;
  });

  it('publishes headerConfig and embeds the overlay header runtime once', async () => {
    const { mountHeader } = await import('../headerConfig');
    mountHeader('login');
    mountHeader('login');

    expect(window.headerConfig?.brand).toEqual({ href: '/', label: 'Multistack' });
    expect(window.headerConfig?.lang).toEqual({ default: 'en' });
    expect(window.headerConfig?.theme).toEqual({ default: 'dark' });
    expect(localStorage.getItem('zds-theme')).toBeNull();

    const embeds = document.querySelectorAll<HTMLScriptElement>('script[data-header-embed]');
    expect(embeds).toHaveLength(1);
    expect(embeds[0].type).toBe('module');
    expect(embeds[0].getAttribute('src')).toBe('/js/header.js');
  });

  it('remounts the header once when nav labels change', async () => {
    const { mountHeader } = await import('../headerConfig');
    const remount = vi.fn().mockResolvedValue(undefined);
    window.__designSystemRemountHeader = remount;

    mountHeader('home');
    expect(remount).not.toHaveBeenCalled();

    document.dispatchEvent(new CustomEvent(HEADER_LANG_CHANGE, { detail: { lang: 'ru' } }));
    expect(remount).toHaveBeenCalledTimes(1);
    expect(window.headerConfig?.nav[0]?.label).toBe(ru.nav.home);

    document.dispatchEvent(new CustomEvent(HEADER_LANG_CHANGE, { detail: { lang: 'ru' } }));
    expect(remount).toHaveBeenCalledTimes(1);

    document.dispatchEvent(new CustomEvent(HEADER_LANG_CHANGE, { detail: { lang: 'en' } }));
    expect(remount).toHaveBeenCalledTimes(2);
  });

  it('embeds the runtime under the product mount', async () => {
    const header = await headerAt('/stack/backend-java-spring/frontend-typescript-jquery/');
    document.body.innerHTML = '<div id="app-header"></div>';

    header.mountHeader('home');

    expect(document.querySelector('script[data-header-embed]')?.getAttribute('src')).toBe(
      '/stack/backend-java-spring/frontend-typescript-jquery/js/header.js',
    );
  });
});
