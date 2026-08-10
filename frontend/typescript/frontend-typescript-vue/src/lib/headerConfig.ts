import { appPath } from './appBase';

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

/** Canonical stack matrix index on autotests.ai landing. */
export const STACK_INDEX_HREF = 'https://autotests.ai/stack/';

/**
 * Canonical header config for the reference-app SPA. Nav hrefs are mount-prefixed
 * so design-system `header.js` matches the live route under
 * `/stack/{backend}/{frontend}/`. Omit `active` — header.js derives it from location.
 */
export const headerConfig: HeaderConfig = {
  brand: { href: appPath('/'), label: 'Reference' },
  nav: [
    { href: appPath('/'), label: 'Home', testid: 'header-nav-home' },
    { href: appPath('/login'), label: 'Login', testid: 'header-nav-login' },
    { href: appPath('/register'), label: 'Register', testid: 'header-nav-register' },
    { href: STACK_INDEX_HREF, label: 'Stack', testid: 'header-nav-stack' },
  ],
  lang: { default: 'en' },
  theme: { default: 'dark' },
};
