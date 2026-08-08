import { appPath } from './appBase';

/**
 * Canonical header config for the reference-app SPA. Nav hrefs are mount-prefixed
 * so design-system `header.js` matches the live route under
 * `/frontend-javascript-vue/`. Omit `active` — header.js derives it from location.
 */
export const headerConfig = {
  brand: { href: appPath('/'), label: 'Reference' },
  nav: [
    { href: appPath('/'), label: 'Home', testid: 'header-nav-home' },
    { href: appPath('/login'), label: 'Login', testid: 'header-nav-login' },
    { href: appPath('/register'), label: 'Register', testid: 'header-nav-register' },
  ],
  lang: { default: 'en' },
  theme: { default: 'dark' },
};
