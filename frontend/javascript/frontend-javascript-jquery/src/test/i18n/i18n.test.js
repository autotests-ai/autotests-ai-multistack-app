import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadScript } from '../helpers/page.js';

function loadI18n() {
  loadScript('js/i18n.js');
  return window.I18n;
}

function leafKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === 'object' ? leafKeys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

describe('i18n helpers', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
    document.documentElement.classList.remove('theme-light');
  });

  it('defaults to en and only accepts en|ru', () => {
    const I18n = loadI18n();
    expect(I18n.readStoredLang()).toBe('en');
    expect(I18n.isLang('en')).toBe(true);
    expect(I18n.isLang('ru')).toBe(true);
    expect(I18n.isLang('de')).toBe(false);
    expect(I18n.isLang(null)).toBe(false);
    expect(I18n.langFromDetail('ru')).toBe('ru');
    expect(I18n.langFromDetail('en')).toBe('en');
    expect(I18n.langFromDetail('de')).toBe('en');
    expect(I18n.langFromDetail(undefined)).toBe('en');
  });

  it('reads zds-lang from storage (persist)', () => {
    const I18n = loadI18n();
    localStorage.setItem(I18n.LANG_STORAGE_KEY, 'ru');
    expect(I18n.readStoredLang()).toBe('ru');
    localStorage.setItem(I18n.LANG_STORAGE_KEY, 'fr');
    expect(I18n.readStoredLang()).toBe('en');
  });

  it('falls back to en when localStorage throws', () => {
    const I18n = loadI18n();
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    expect(I18n.readStoredLang()).toBe('en');
    getItem.mockRestore();
  });

  it('applies html[lang] and keeps the event name aligned with header.js', () => {
    const I18n = loadI18n();
    I18n.applyDocumentLang('ru');
    expect(document.documentElement.lang).toBe('ru');
    I18n.applyDocumentLang('en');
    expect(document.documentElement.lang).toBe('en');
    expect(I18n.HEADER_LANG_CHANGE).toBe('header:lang-change');
  });

  it('keeps theme-light on html when applying lang (theme stays in header.js)', () => {
    const I18n = loadI18n();
    document.documentElement.classList.add('theme-light');
    I18n.applyDocumentLang('ru');
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    expect(document.documentElement.lang).toBe('ru');
  });

  it('keeps en/ru dictionaries 1:1 and a jquery-specific home.blurb', () => {
    const I18n = loadI18n();
    expect(leafKeys(I18n.en)).toEqual(leafKeys(I18n.ru));
    expect(leafKeys(I18n.dictionaries.en)).toEqual(leafKeys(I18n.dictionaries.ru));
    expect(I18n.en.home.blurb).toBe('jQuery demo — items loaded from {api}.');
    expect(I18n.ru.home.blurb).toBe('Демо jQuery — элементы из {api}.');
    expect(I18n.en.home.blurb).not.toMatch(/React SPA|Vanilla/);
    expect(I18n.ru.home.blurb).not.toMatch(/React|Vanilla/);
    expect(I18n.en.login.title).toBe('Login Form');
    expect(I18n.ru.login.title).toBe('Форма входа');
    expect(I18n.en.auth.errorLoginRequired).toBe(
      'Login is required (minimum {minLogin} characters)',
    );
  });
});

describe('headerConfig nav labels', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
  });

  it('retitles nav from the dictionary and keeps testids', () => {
    loadScript('js/app-base.js');
    loadI18n();
    loadScript('js/header-config.js');
    const enConfig = window.buildHeaderConfig('en');
    const ruConfig = window.buildHeaderConfig('ru');
    expect(enConfig.nav.map((item) => item.testid)).toEqual([
      'header-nav-home',
      'header-nav-login',
      'header-nav-register',
      'header-nav-stack',
    ]);
    expect(enConfig.nav.map((item) => item.label)).toEqual(['Home', 'Login', 'Register', 'Stack']);
    expect(ruConfig.nav.map((item) => item.label)).toEqual([
      'Главная',
      'Вход',
      'Регистрация',
      'Стек',
    ]);
    expect(enConfig.lang.default).toBe('en');
    expect(enConfig.theme.default).toBe('dark');
  });
});
