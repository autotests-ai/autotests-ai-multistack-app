import type { AuthMessages } from '../auth';
import { en } from './en';
import { ru } from './ru';
import type { Dictionary, Lang } from './types';

/** Mirror of `HEADER_LANG_CHANGE` in design-system `js/header.js`. */
export const HEADER_LANG_CHANGE = 'header:lang-change';
/** Mirror of `LANG_STORAGE_KEY` in design-system `js/header.js`. */
export const LANG_STORAGE_KEY = 'zds-lang';

export const dictionaries: Record<Lang, Dictionary> = { en, ru };

export { en } from './en';
export { ru } from './ru';
export type { Dictionary, Lang } from './types';

export function isLang(value: string | null | undefined): value is Lang {
  return value === 'en' || value === 'ru';
}

export function langFromDetail(lang: string | null | undefined): Lang {
  return lang === 'ru' ? 'ru' : 'en';
}

export function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (isLang(stored)) {
      return stored;
    }
  } catch {
    // private mode / blocked storage
  }
  return 'en';
}

export function applyDocumentLang(lang: Lang): void {
  document.documentElement.lang = lang;
}

function lookup(dict: Dictionary, path: string | null): unknown {
  return String(path || '')
    .split('.')
    .reduce<unknown>((acc, key) => {
      if (acc == null || typeof acc !== 'object') {
        return undefined;
      }
      return (acc as Record<string, unknown>)[key];
    }, dict);
}

export function applyDataI18n(copy: Dictionary): void {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const value = lookup(copy, el.getAttribute('data-i18n'));
    if (typeof value === 'string') {
      el.textContent = value;
    }
  });
}

export function loginMessages(lang: Lang = readStoredLang()): AuthMessages {
  const copy = dictionaries[lang];
  return {
    ...copy.auth,
    errorWrongCredentials: copy.login.errorWrongCredentials,
  };
}

export function registerMessages(lang: Lang = readStoredLang()): AuthMessages {
  const copy = dictionaries[lang];
  return {
    ...copy.auth,
    errorPasswordMismatch: copy.register.errorPasswordMismatch,
    errorRegistrationFailed: copy.register.errorRegistrationFailed,
  };
}

/** Survives `vi.resetModules()` so a remounted page does not stack lang listeners. */
const I18N_HANDLER = Symbol.for('frontend-typescript-jquery.i18n');

export function startI18n(applyCopy?: (copy: Dictionary, lang: Lang) => void): void {
  const previous = (window as unknown as Record<symbol, EventListener | undefined>)[I18N_HANDLER];
  if (previous) {
    document.removeEventListener(HEADER_LANG_CHANGE, previous);
  }
  const apply = (lang: string | null | undefined) => {
    const code = langFromDetail(lang);
    const copy = dictionaries[code];
    applyDocumentLang(code);
    applyDataI18n(copy);
    applyCopy?.(copy, code);
  };
  const onLang = (event: Event) => {
    apply((event as CustomEvent<{ lang?: string }>).detail?.lang);
  };
  (window as unknown as Record<symbol, EventListener>)[I18N_HANDLER] = onLang;
  document.addEventListener(HEADER_LANG_CHANGE, onLang);
  apply(readStoredLang());
}
