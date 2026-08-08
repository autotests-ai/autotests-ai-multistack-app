import { appPath } from './app-base';

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

/**
 * Canonical header config for the reference-app SPA. Nav hrefs are mount-prefixed
 * so design-system `header.js` matches the live route under
 * `/frontend-typescript-angular/`. Omit `active` — header.js derives it from location.
 */
export const headerConfig: HeaderConfig = {
  brand: { href: appPath('/'), label: 'Reference' },
  nav: [
    { href: appPath('/'), label: 'Home', testid: 'header-nav-home' },
    { href: appPath('/login'), label: 'Login', testid: 'header-nav-login' },
    { href: appPath('/register'), label: 'Register', testid: 'header-nav-register' },
  ],
  lang: { default: 'en' },
  theme: { default: 'dark' },
};
