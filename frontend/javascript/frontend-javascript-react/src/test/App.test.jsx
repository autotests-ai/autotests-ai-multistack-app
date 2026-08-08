import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';

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

function renderApp(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    stubApis();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mounts the header slot and routes / to the home page', async () => {
    renderApp('/');

    expect(screen.getByTestId('app-header-mount')).toBeInTheDocument();
    expect(screen.getByTestId('reference-layout')).toBeInTheDocument();
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
});
