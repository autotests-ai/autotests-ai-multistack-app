import { computed, DestroyRef, inject, signal } from '@angular/core';
import { en } from './en.js';
import { ru } from './ru.js';

/** Mirror of `HEADER_LANG_CHANGE` in design-system `js/header.js`. */
export const HEADER_LANG_CHANGE = 'header:lang-change';
/** Mirror of `LANG_STORAGE_KEY` in design-system `js/header.js`. */
export const LANG_STORAGE_KEY = 'zds-lang';

export const dictionaries = { en, ru };

export { en } from './en.js';
export { ru } from './ru.js';

export function isLang(value) {
  return value === 'en' || value === 'ru';
}

export function langFromDetail(lang) {
  return lang === 'ru' ? 'ru' : 'en';
}

export function readStoredLang() {
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

export function applyDocumentLang(lang) {
  document.documentElement.lang = lang;
}

/**
 * Analog of React `useI18n()`: per-component signals + `header:lang-change`.
 * Must run in an injection context (component field initialiser).
 */
export function useI18n() {
  const lang = signal(readStoredLang());
  applyDocumentLang(lang());

  const onLang = (event) => {
    const next = langFromDetail(event.detail?.lang);
    lang.set(next);
    applyDocumentLang(next);
  };
  document.addEventListener(HEADER_LANG_CHANGE, onLang);
  inject(DestroyRef).onDestroy(() => {
    document.removeEventListener(HEADER_LANG_CHANGE, onLang);
  });

  return {
    lang,
    copy: computed(() => dictionaries[lang()]),
  };
}
