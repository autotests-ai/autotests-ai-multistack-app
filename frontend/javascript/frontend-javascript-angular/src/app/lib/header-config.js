import { appPath } from './app-base.js';

/**
 * Minimal header contract matching design-system `window.headerConfig`.
 *
 * @typedef {{ href: string, label: string, active?: boolean, testid?: string }} HeaderNavItem
 * @typedef {{
 *   brand: { href: string, label: string },
 *   nav: HeaderNavItem[],
 *   lang: { default: string },
 *   theme: { default: string },
 * }} HeaderConfig
 */

/**
 * Canonical header config for the Multistack SPA. Nav hrefs are mount-prefixed
 * so design-system `header.js` matches the live route under
 * `/frontend-javascript-angular/`. Omit `active` — header.js derives it from location.
 */

/** Stack matrix board — origin `/stack/`, not `/{pair}/stack`. */
export const STACK_INDEX_HREF = '/stack/';

/** @type {HeaderConfig} */
export const headerConfig = {
  brand: { href: appPath('/'), label: 'Multistack' },
  nav: [
    { href: appPath('/'), label: 'Home', testid: 'header-nav-home' },
    { href: appPath('/login'), label: 'Login', testid: 'header-nav-login' },
    { href: appPath('/register'), label: 'Register', testid: 'header-nav-register' },
    { href: STACK_INDEX_HREF, label: 'Stack', testid: 'header-nav-stack' },
  ],
  lang: { default: 'en' },
  theme: { default: 'dark' },
};
