import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
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

/**
 * Per-component i18n, same contract as React `useI18n`: read `zds-lang`,
 * apply `html[lang]`, listen for `header:lang-change`. Theme stays in header.js.
 */
@Injectable()
export class I18nService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly langState = signal<Lang>(readStoredLang());
  readonly lang = this.langState.asReadonly();
  readonly copy = computed<Dictionary>(() => dictionaries[this.langState()]);

  constructor() {
    applyDocumentLang(this.langState());
    const onLang = (event: Event) => {
      const detail = (event as CustomEvent<{ lang?: string }>).detail;
      const next = langFromDetail(detail?.lang);
      this.langState.set(next);
      applyDocumentLang(next);
    };
    document.addEventListener(HEADER_LANG_CHANGE, onLang);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener(HEADER_LANG_CHANGE, onLang);
    });
  }
}
