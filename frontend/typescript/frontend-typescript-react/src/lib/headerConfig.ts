import type { HeaderConfig } from '@zero-design-system/react';
import { APP_BASE, appPath } from './appBase';

/** Current stack pair — `/stack/{backend}/{frontend}`, never `…/stack`. */
export const STACK_INDEX_HREF = APP_BASE || '/';

/**
 * Canonical header config for the reference-app SPA. Nav hrefs are mount-prefixed
 * so design-system `header.js` (real location) matches the live route under
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
