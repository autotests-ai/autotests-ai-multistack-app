import type { HeaderConfig } from '@zero-design-system/react';
import { envNavItems } from '../../../../_shared/frontend-javascript-app/js/env-hosts.js';
import { appPath } from './appBase';

/** Stack matrix board — origin `/stack/`, not `/{pair}/stack`. */
export const STACK_INDEX_HREF = '/stack/';

/**
 * Canonical header config for the Multistack SPA. Nav hrefs are mount-prefixed
 * so design-system `header.js` (real location) matches the live route under
 * `/stack/{backend}/{frontend}/`. Omit `active` — header.js derives it from location.
 * Stage/Prod come from `js/env-hosts.js` (generated from matrix `public_host`).
 */
export const headerConfig: HeaderConfig = {
  brand: { href: appPath('/'), label: 'Multistack' },
  nav: [
    { href: appPath('/'), label: 'Home', testid: 'header-nav-home' },
    { href: appPath('/login'), label: 'Login', testid: 'header-nav-login' },
    { href: appPath('/register'), label: 'Register', testid: 'header-nav-register' },
    { href: STACK_INDEX_HREF, label: 'Stack', testid: 'header-nav-stack' },
    ...envNavItems(),
  ],
  lang: { default: 'en' },
  theme: { default: 'dark' },
};
