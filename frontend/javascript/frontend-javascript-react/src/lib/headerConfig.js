import { appPath } from './appBase';

/** Stack matrix board — origin `/stack/`, not `/{pair}/stack`. */
export const STACK_INDEX_HREF = '/stack/';

/**
 * Canonical header config for the reference-app SPA. Nav hrefs are mount-prefixed
 * so design-system `header.js` (real location) matches the live route under
 * `/frontend-javascript-react/`. Omit `active` — header.js derives it from location.
 */
export const headerConfig = {
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
