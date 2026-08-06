import type { HeaderConfig } from '@zero-design-system/react';
import { appPath } from './appBase';

/**
 * Canonical header config for the reference-app SPA. Nav hrefs are mount-prefixed
 * so design-system `header.js` (real location) matches the live route under
 * `/frontend-typescript-react/`. Omit `active` — header.js derives it from location.
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
