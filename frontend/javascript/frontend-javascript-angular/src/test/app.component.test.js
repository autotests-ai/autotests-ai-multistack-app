import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { screen, waitFor } from '@testing-library/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppComponent } from '../app/app.component.js';
import { routes } from '../app/app.routes.js';

function jsonResponse(body) {
  return { ok: true, status: 200, json: async () => body };
}

function stubApis() {
  vi.stubGlobal(
    'fetch',
    vi.fn((input) => {
      const url = String(input);
      if (url.includes('/api/health')) {
        return Promise.resolve(jsonResponse({ status: 'UP', service: 'reference-app' }));
      }
      if (url.includes('/api/items')) {
        return Promise.resolve(jsonResponse({ items: [] }));
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    }),
  );
}

async function renderApp(initialPath) {
  TestBed.configureTestingModule({
    providers: [provideRouter(routes), provideLocationMocks()],
  });
  const fixture = TestBed.createComponent(AppComponent);
  fixture.autoDetectChanges();
  await TestBed.inject(Router).navigateByUrl(initialPath);
  // Activating an outlet only creates the routed view; `whenStable()` waits for the
  // change-detection pass that actually applies its bindings.
  await fixture.whenStable();
  return fixture;
}

describe('AppComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.headerConfig;
    document.querySelector('script[data-header-embed]')?.remove();
    stubApis();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mounts the header slot and routes / to the home page', async () => {
    await renderApp('/');

    expect(screen.getByTestId('app-header-mount')).toBeInTheDocument();
    expect(screen.getByTestId('app-header-mount')).toHaveAttribute('id', 'app-header');
    expect(screen.getByTestId('reference-layout')).toBeInTheDocument();
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

  // The header markup itself stays SSOT in `js/header.js` — this module only has to
  // hand it a config and load it.
  it('publishes the canonical header config for the design-system runtime', async () => {
    await renderApp('/');

    expect(window.headerConfig).toEqual({
      brand: { href: '/', label: 'Reference' },
      nav: [
        { href: '/', label: 'Home', testid: 'header-nav-home' },
        { href: '/login', label: 'Login', testid: 'header-nav-login' },
        { href: '/register', label: 'Register', testid: 'header-nav-register' },
      ],
      lang: { default: 'en' },
      theme: { default: 'dark' },
    });
  });

  it('injects the header runtime script from the mount exactly once', async () => {
    await renderApp('/');

    const scripts = document.querySelectorAll('script[data-header-embed]');
    expect(scripts).toHaveLength(1);
    expect(scripts[0].type).toBe('module');
    expect(scripts[0].getAttribute('src')).toBe('/js/header.js');
  });
});
