import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HEADER_LANG_CHANGE, ru } from '../i18n';
import { buildHeaderConfig } from '../lib/headerConfig';
import { routes } from '../routes';

function dispatchLang(lang: string) {
  act(() => {
    document.dispatchEvent(new CustomEvent(HEADER_LANG_CHANGE, { detail: { lang } }));
  });
}

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

// Same route objects the browser entry uses, driven by an in-memory history.
function renderApp(initialPath: string) {
  return render(
    <RouterProvider router={createMemoryRouter(routes, { initialEntries: [initialPath] })} />,
  );
}

describe('App', { tags: ['smoke'] }, () => {
  beforeEach(() => {
    localStorage.clear();
    stubApis();
    window.headerConfig = buildHeaderConfig('en');
    window.__designSystemRemountHeader = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.headerConfig;
    delete window.__designSystemRemountHeader;
  });

  it('mounts the header slot and routes / to the home page', async () => {
    renderApp('/');

    expect(screen.getByTestId('app-header-mount')).toBeInTheDocument();
    expect(screen.getByTestId('multistack-layout')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('items-list')).toHaveTextContent('No items found.'),
    );
  });

  it('routes /login to the login form', () => {
    renderApp('/login');

    expect(screen.getByTestId('login-form-title')).toHaveTextContent('Login Form');
  });

  it('routes /register to the register form', () => {
    renderApp('/register');

    expect(screen.getByTestId('register-form-title')).toHaveTextContent('Register');
  });

  it('remounts header nav once when language changes', async () => {
    const remount = window.__designSystemRemountHeader as ReturnType<typeof vi.fn>;
    renderApp('/login');

    expect(screen.getByTestId('login-form-title')).toHaveTextContent('Login Form');
    dispatchLang('ru');
    expect(screen.getByTestId('login-form-title')).toHaveTextContent(ru.login.title);
    await waitFor(() => expect(remount).toHaveBeenCalledTimes(1));

    dispatchLang('ru');
    expect(remount).toHaveBeenCalledTimes(1);
  });
});
