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

declare global {
  interface Window {
    headerConfig?: HeaderConfig;
  }
}

/** Nav route of the page doing the mounting. */
export type HeaderRoute = '/' | '/login' | '/register';

/** Stack matrix board — origin `/stack/`, not `/{pair}/stack`. */
const STACK_INDEX_HREF = '/stack/';

/**
 * Nav hrefs are mount-prefixed so design-system `header.js` matches the live
 * route. `active` is only the fallback highlight — header.js prefers the real
 * location, which differs here when a page is opened as `/login.html`.
 */
export function headerConfigFor(route: HeaderRoute): HeaderConfig {
  return {
    brand: { href: appPath('/'), label: 'Multistack' },
    nav: [
      { href: appPath('/'), label: 'Home', active: route === '/', testid: 'header-nav-home' },
      {
        href: appPath('/login'),
        label: 'Login',
        active: route === '/login',
        testid: 'header-nav-login',
      },
      {
        href: appPath('/register'),
        label: 'Register',
        active: route === '/register',
        testid: 'header-nav-register',
      },
      { href: STACK_INDEX_HREF, label: 'Stack', testid: 'header-nav-stack' },
    ],
    lang: { default: 'en' },
    theme: { default: 'dark' },
  };
}

/**
 * Publish the config and embed the design-system header runtime into `#app-header`.
 *
 * `js/header.js` ships in the `vendor/ds` overlay, not in this module, so it
 * cannot be a static `<script>` tag: Vite resolves those at build time and would
 * fail on the missing file. The tag is created here instead — same wiring as
 * `frontend-javascript-vanilla`, one step later.
 */
export function mountHeader(route: HeaderRoute): void {
  window.headerConfig = headerConfigFor(route);

  if (document.querySelector('script[data-header-embed]')) {
    return;
  }
  const script = document.createElement('script');
  script.type = 'module';
  script.src = appPath('/js/header.js');
  script.dataset.headerEmbed = 'true';
  document.body.appendChild(script);
}
