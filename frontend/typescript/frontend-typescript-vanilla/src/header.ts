import { appPath } from './appBase';
import {
  dictionaries,
  HEADER_LANG_CHANGE,
  langFromDetail,
  readStoredLang,
  type Lang,
} from './i18n';

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
    __designSystemRemountHeader?: () => void | Promise<void>;
  }
}

/** Nav route of the page doing the mounting. */
export type HeaderRoute = '/' | '/login' | '/register';

/** Stack matrix board — origin `/stack/`, not `/{pair}/stack`. */
const STACK_INDEX_HREF = '/stack/';

function navLabelsKey(config: HeaderConfig): string {
  return config.nav.map((item) => item.label).join('\0');
}

/**
 * Nav hrefs are mount-prefixed so design-system `header.js` matches the live
 * route. `active` is only the fallback highlight — header.js prefers the real
 * location, which differs here when a page is opened as `/login.html`.
 * Labels follow the page dictionary; testids and hrefs stay stable.
 */
export function headerConfigFor(route: HeaderRoute, lang: Lang = readStoredLang()): HeaderConfig {
  const nav = dictionaries[lang].nav;
  return {
    brand: { href: appPath('/'), label: 'Multistack' },
    nav: [
      { href: appPath('/'), label: nav.home, active: route === '/', testid: 'header-nav-home' },
      {
        href: appPath('/login'),
        label: nav.login,
        active: route === '/login',
        testid: 'header-nav-login',
      },
      {
        href: appPath('/register'),
        label: nav.register,
        active: route === '/register',
        testid: 'header-nav-register',
      },
      { href: STACK_INDEX_HREF, label: nav.stack, testid: 'header-nav-stack' },
    ],
    lang: { default: 'en' },
    theme: { default: 'dark' },
  };
}

let langBound = false;

function bindLangRemount(route: HeaderRoute): void {
  if (langBound) {
    return;
  }
  langBound = true;
  let navKey = navLabelsKey(headerConfigFor(route));
  document.addEventListener(HEADER_LANG_CHANGE, (event) => {
    const lang = langFromDetail((event as CustomEvent<{ lang?: string }>).detail?.lang);
    const config = headerConfigFor(route, lang);
    window.headerConfig = config;
    const next = navLabelsKey(config);
    if (next !== navKey) {
      window.__designSystemRemountHeader?.();
    }
    navKey = next;
  });
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
  bindLangRemount(route);

  if (document.querySelector('script[data-header-embed]')) {
    return;
  }
  const script = document.createElement('script');
  script.type = 'module';
  script.src = appPath('/js/header.js');
  script.dataset.headerEmbed = 'true';
  document.body.appendChild(script);
}
