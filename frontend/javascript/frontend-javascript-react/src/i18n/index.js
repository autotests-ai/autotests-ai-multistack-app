import { useEffect, useState } from 'react';
import { en } from './en';
import { ru } from './ru';

/** Mirror of `HEADER_LANG_CHANGE` in design-system `js/header.js`. */
export const HEADER_LANG_CHANGE = 'header:lang-change';
/** Mirror of `LANG_STORAGE_KEY` in design-system `js/header.js`. */
export const LANG_STORAGE_KEY = 'zds-lang';

export const dictionaries = { en, ru };

export { en } from './en';
export { ru } from './ru';

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

export function useI18n() {
  const [lang, setLang] = useState(readStoredLang);

  useEffect(() => {
    applyDocumentLang(lang);
  }, [lang]);

  useEffect(() => {
    const onLang = (event) => {
      setLang(langFromDetail(event.detail?.lang));
    };
    document.addEventListener(HEADER_LANG_CHANGE, onLang);
    return () => document.removeEventListener(HEADER_LANG_CHANGE, onLang);
  }, []);

  return { lang, copy: dictionaries[lang] };
}
