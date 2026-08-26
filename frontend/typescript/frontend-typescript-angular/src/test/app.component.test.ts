import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { screen, waitFor } from '@testing-library/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppComponent } from '../app/app.component';
import { routes } from '../app/app.routes';
import { HEADER_LANG_CHANGE, ru } from '../i18n';

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}

function stubApis() {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/health')) {
        return Promise.resolve(jsonResponse({ status: 'UP', service: 'backend-java-spring' }));
      }
      if (url.includes('/api/items')) {
        return Promise.resolve(jsonResponse({ items: [] }));
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    }),
  );
}

async function renderApp(initialPath: string) {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideRouter(routes)],
  });
  const fixture = TestBed.createComponent(AppComponent);
  fixture.autoDetectChanges();
  await TestBed.inject(Router).navigateByUrl(initialPath);
  await fixture.whenStable();
  return fixture;
}

describe('AppComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
    document.querySelectorAll('script[data-header-embed]').forEach((node) => {
      node.remove();
    });
    delete window.headerConfig;
    window.__designSystemRemountHeader = vi.fn().mockResolvedValue(undefined);
    stubApis();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
    delete window.headerConfig;
    delete window.__designSystemRemountHeader;
    document.documentElement.lang = 'en';
  });

  it('mounts the header slot and routes / to the home page', async () => {
    await renderApp('/');

    expect(screen.getByTestId('app-header-mount')).toBeInTheDocument();
    expect(screen.getByTestId('multistack-layout')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('items-list')).toHaveTextContent('No items found.'),
    );
  });

  it('routes /login to the login form', async () => {
    await renderApp('/login');

    expect(screen.getByTestId('login-form-title')).toHaveTextContent('Login Form');
  });

  it('routes /register to the register form', async () => {
    await renderApp('/register');

    expect(screen.getByTestId('register-form-title')).toHaveTextContent('Register');
  });

  // header.js is SSOT: this module only publishes the config and embeds the script once.
  it('publishes headerConfig and embeds the design-system header script exactly once', async () => {
    await renderApp('/');

    expect(window.headerConfig?.nav?.map((item) => item.testid)).toEqual([
      'header-nav-home',
      'header-nav-login',
      'header-nav-register',
      'header-nav-stack',
    ]);
    expect(window.headerConfig?.nav?.map((item) => item.href)).toEqual([
      '/',
      '/login',
      '/register',
      '/stack/',
    ]);
    expect(window.headerConfig?.lang?.default).toBe('en');
    expect(window.headerConfig?.theme?.default).toBe('dark');
    expect(document.querySelectorAll('script[data-header-embed]')).toHaveLength(1);
  });

  it('remounts header nav once when language changes', async () => {
    const remount = window.__designSystemRemountHeader as ReturnType<typeof vi.fn>;
    await renderApp('/login');

    expect(screen.getByTestId('login-form-title')).toHaveTextContent('Login Form');
    document.dispatchEvent(new CustomEvent(HEADER_LANG_CHANGE, { detail: { lang: 'ru' } }));
    TestBed.inject(ApplicationRef).tick();
    expect(screen.getByTestId('login-form-title')).toHaveTextContent(ru.login.title);
    await waitFor(() => expect(remount).toHaveBeenCalledTimes(1));

    document.dispatchEvent(new CustomEvent(HEADER_LANG_CHANGE, { detail: { lang: 'ru' } }));
    TestBed.inject(ApplicationRef).tick();
    expect(remount).toHaveBeenCalledTimes(1);
  });
});
