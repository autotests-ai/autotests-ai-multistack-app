import type { HeaderConfig } from '@zero-design-system/react';
import { appPath } from './appBase';

/** Stack matrix board — origin `/stack/`, not `/{pair}/stack`. */
export const STACK_INDEX_HREF = '/stack/';

/** Matrix clone hosts — header.js `match: 'host'` rewrites these to the live path. */
export const STAGE_ORIGIN = 'https://stage.autotests.ai';
export const PROD_ORIGIN = 'https://autotests.ai';

/**
 * Canonical header config for the Multistack SPA. Nav hrefs are mount-prefixed
 * so design-system `header.js` (real location) matches the live route under
 * `/stack/{backend}/{frontend}/`. Omit `active` — header.js derives it from location.
 */
export const headerConfig: HeaderConfig = {
  brand: { href: appPath('/'), label: 'Multistack' },
  nav: [
    { href: appPath('/'), label: 'Home', testid: 'header-nav-home' },
    { href: appPath('/login'), label: 'Login', testid: 'header-nav-login' },
    { href: appPath('/register'), label: 'Register', testid: 'header-nav-register' },
    { href: STACK_INDEX_HREF, label: 'Stack', testid: 'header-nav-stack' },
    {
      href: `${STAGE_ORIGIN}/`,
      label: 'Stage',
      testid: 'header-nav-stage',
      match: 'host',
    },
    {
      href: `${PROD_ORIGIN}/`,
      label: 'Prod',
      testid: 'header-nav-prod',
      match: 'host',
    },
  ],
  lang: { default: 'en' },
  theme: { default: 'dark' },
};
