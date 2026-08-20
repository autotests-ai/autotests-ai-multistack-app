import { appPath } from './appBase';

export type HeaderNavId = 'home' | 'login' | 'register';

export interface HeaderNavItem {
  href: string;
  label: string;
  active?: boolean;
  testid?: string;
}

/** Minimal header contract matching design-system `window.headerConfig`. */
export interface HeaderConfig {
  brand: { href: string; label: string };
  nav: HeaderNavItem[];
  lang: { default: string };
  theme: { default: string };
}

declare global {
  interface Window {
    headerConfig?: HeaderConfig;
  }
}

/** Served by the vendor/ds overlay next to the built documents — never bundled. */
const HEADER_SCRIPT_PATH = '/js/header.js';

/**
 * Canonical header config for the Multistack pages. Nav hrefs are mount-prefixed
 * so design-system `header.js` matches the live document under
 * `/{backend}/frontend-typescript-jquery/`.
 */
export function buildHeaderConfig(current: HeaderNavId): HeaderConfig {
  return {
    brand: { href: appPath('/'), label: 'Multistack' },
    nav: [
      { href: appPath('/'), label: 'Home', active: current === 'home', testid: 'header-nav-home' },
      {
        href: appPath('/login'),
        label: 'Login',
        active: current === 'login',
        testid: 'header-nav-login',
      },
      {
        href: appPath('/register'),
        label: 'Register',
        active: current === 'register',
        testid: 'header-nav-register',
      },
      { href: '/stack/', label: 'Stack', active: false, testid: 'header-nav-stack' },
    ],
    lang: { default: 'en' },
    theme: { default: 'dark' },
  };
}

/**
 * Publish `window.headerConfig`, then load the header runtime. Each screen is its own
 * document, so every entry publishes its own nav state before the script tag runs.
 */
export function mountHeader(current: HeaderNavId): void {
  window.headerConfig = buildHeaderConfig(current);

  if (document.querySelector('script[data-header-embed]')) {
    return;
  }
  const headerScript = document.createElement('script');
  headerScript.type = 'module';
  headerScript.src = appPath(HEADER_SCRIPT_PATH);
  headerScript.dataset.headerEmbed = 'true';
  document.body.appendChild(headerScript);
}
