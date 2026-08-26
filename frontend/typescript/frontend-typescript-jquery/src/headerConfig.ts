import { appPath } from './appBase';
import {
  dictionaries,
  HEADER_LANG_CHANGE,
  langFromDetail,
  readStoredLang,
  type Lang,
} from './i18n';

export type HeaderNavId = 'home' | 'login' | 'register';

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

/** Served by the vendor/ds overlay next to the built documents — never bundled. */
const HEADER_SCRIPT_PATH = '/js/header.js';

/** Stack matrix board — origin `/stack/`, not `/{pair}/stack`. */
export const STACK_INDEX_HREF = '/stack/';

/** Survives `vi.resetModules()` so a remounted page does not stack lang listeners. */
const LANG_REMOUNT_HANDLER = Symbol.for('frontend-typescript-jquery.langRemount');

function navLabelsKey(config: HeaderConfig): string {
  return config.nav.map((item) => item.label).join('\0');
}

/**
 * Canonical header config for the Multistack pages. Nav hrefs are mount-prefixed
 * so design-system `header.js` matches the live document under
 * `/{backend}/frontend-typescript-jquery/`. Omit theme logic — `header.js` owns
 * `zds-theme`. Nav *labels* follow the page dictionary; testids and hrefs stay stable.
 */
export function buildHeaderConfig(
  current: HeaderNavId,
  lang: Lang = readStoredLang(),
): HeaderConfig {
  const nav = dictionaries[lang].nav;
  return {
    brand: { href: appPath('/'), label: 'Multistack' },
    nav: [
      {
        href: appPath('/'),
        label: nav.home,
        active: current === 'home',
        testid: 'header-nav-home',
      },
      {
        href: appPath('/login'),
        label: nav.login,
        active: current === 'login',
        testid: 'header-nav-login',
      },
      {
        href: appPath('/register'),
        label: nav.register,
        active: current === 'register',
        testid: 'header-nav-register',
      },
      { href: STACK_INDEX_HREF, label: nav.stack, active: false, testid: 'header-nav-stack' },
    ],
    lang: { default: 'en' },
    theme: { default: 'dark' },
  };
}

function bindLangRemount(current: HeaderNavId): void {
  const previous = (window as unknown as Record<symbol, EventListener | undefined>)[
    LANG_REMOUNT_HANDLER
  ];
  if (previous) {
    document.removeEventListener(HEADER_LANG_CHANGE, previous);
  }
  let navKey = navLabelsKey(buildHeaderConfig(current));
  const onLang = (event: Event) => {
    const lang = langFromDetail((event as CustomEvent<{ lang?: string }>).detail?.lang);
    const config = buildHeaderConfig(current, lang);
    window.headerConfig = config;
    const next = navLabelsKey(config);
    if (next !== navKey) {
      void window.__designSystemRemountHeader?.();
    }
    navKey = next;
  };
  (window as unknown as Record<symbol, EventListener>)[LANG_REMOUNT_HANDLER] = onLang;
  document.addEventListener(HEADER_LANG_CHANGE, onLang);
}

/**
 * Publish `window.headerConfig`, then load the header runtime. Each screen is its own
 * document, so every entry publishes its own nav state before the script tag runs.
 * Theme stays in header.js — this only retitles nav after `header:lang-change`.
 */
export function mountHeader(current: HeaderNavId): void {
  window.headerConfig = buildHeaderConfig(current);
  bindLangRemount(current);

  if (document.querySelector('script[data-header-embed]')) {
    return;
  }
  const headerScript = document.createElement('script');
  headerScript.type = 'module';
  headerScript.src = appPath(HEADER_SCRIPT_PATH);
  headerScript.dataset.headerEmbed = 'true';
  document.body.appendChild(headerScript);
}
