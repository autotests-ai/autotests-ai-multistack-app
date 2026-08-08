import { provideLocationMocks } from '@angular/common/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeComponent } from '../../app/pages/home.component.js';

@Component({ selector: 'app-blank', standalone: true, template: '' })
class BlankComponent {}

function jsonResponse(body, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

let router;

/**
 * `provideLocationMocks()` keeps navigation off jsdom's real history and removes the
 * need for a `<base href>`; `autoDetectChanges()` lets zoneless change detection
 * flush on its own, so Testing Library's `waitFor` sees the signal updates.
 */
function renderHome() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: '', component: HomeComponent },
        { path: 'login', component: BlankComponent },
      ]),
      provideLocationMocks(),
    ],
  });
  router = TestBed.inject(Router);
  const fixture = TestBed.createComponent(HomeComponent);
  fixture.autoDetectChanges();
  return fixture;
}

function stubDefaultApis(overrides) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input, init) => {
      const url = String(input);
      const override = overrides?.(url, init);
      if (override) return Promise.resolve(override);

      if (url.includes('/api/health')) {
        return Promise.resolve(jsonResponse({ status: 'UP', service: 'reference-app' }));
      }
      if (url.includes('/api/items')) {
        return Promise.resolve(
          jsonResponse({ items: [{ id: 1, name: 'Alpha', description: 'First item' }] }),
        );
      }
      if (url.includes('/api/auth/me') && init?.method === 'DELETE') {
        return Promise.resolve(jsonResponse({}, true, 204));
      }
      if (url.includes('/api/auth/me')) {
        return Promise.resolve(jsonResponse({ username: 'user1' }));
      }
      if (url.includes('/api/auth/logout')) {
        return Promise.resolve(jsonResponse({}, true, 204));
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    }),
  );
}

function deleteAccountCalls() {
  return globalThis.fetch.mock.calls.filter(
    ([input, init]) => String(input).includes('/api/auth/me') && init?.method === 'DELETE',
  );
}

describe('HomeComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    stubDefaultApis();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the reference layout with health and items from the API', async () => {
    renderHome();

    expect(screen.getByTestId('reference-layout')).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByTestId('health-status')).toHaveTextContent(
        '→ UP | service: reference-app | frontend: frontend-javascript-angular',
      ),
    );

    expect(await screen.findByTestId('item-row')).toHaveTextContent('Alpha');
  });

  it('renders the module copy in the Reference App panel', async () => {
    renderHome();

    expect(screen.getByTestId('reference-layout')).toHaveTextContent(
      'JavaScript Angular SPA — items loaded from /api/items.',
    );
  });

  it('shows the empty state when the API returns no items', async () => {
    stubDefaultApis((url) => (url.includes('/api/items') ? jsonResponse({ items: [] }) : null));
    renderHome();

    await waitFor(() =>
      expect(screen.getByTestId('items-list')).toHaveTextContent('No items found.'),
    );
  });

  it('shows the items error state when the items call fails', async () => {
    stubDefaultApis((url) =>
      url.includes('/api/items') ? jsonResponse({ message: 'boom' }, false, 500) : null,
    );
    renderHome();

    await waitFor(() =>
      expect(screen.getByTestId('items-list')).toHaveTextContent('✗ items: HTTP 500'),
    );
  });

  it('shows the health error state when the health call fails', async () => {
    stubDefaultApis((url) =>
      url.includes('/api/health') ? jsonResponse({ message: 'down' }, false, 503) : null,
    );
    renderHome();

    await waitFor(() =>
      expect(screen.getByTestId('health-status')).toHaveTextContent('✗ health: HTTP 503'),
    );
    expect(screen.getByTestId('health-status')).toHaveClass('reference-app__error');
  });

  it('keeps the welcome panel hidden without a session token', async () => {
    renderHome();

    await waitFor(() => expect(screen.getByTestId('item-row')).toBeInTheDocument());
    expect(screen.getByTestId('welcome-panel')).not.toBeVisible();
  });

  it('shows welcome, logout and delete account when profile loads for a session token', async () => {
    localStorage.setItem('authToken', 'valid-token');
    renderHome();

    await waitFor(() =>
      expect(screen.getByTestId('welcome-message')).toHaveTextContent('Welcome, user1!'),
    );
    expect(screen.getByTestId('welcome-panel')).toBeVisible();
    expect(screen.getByTestId('logout-button')).toHaveTextContent('Logout');
    expect(screen.getByTestId('logout-button')).toHaveClass('btn', 'btn--primary');
    expect(screen.getByTestId('delete-account-button')).toHaveTextContent('Delete account');
    expect(screen.getByTestId('delete-account-button')).toHaveClass('btn', 'btn--danger');
  });

  it('logs out and navigates to login', async () => {
    const user = userEvent.setup();
    localStorage.setItem('authToken', 'valid-token');
    renderHome();

    await user.click(await screen.findByTestId('logout-button'));

    await waitFor(() => expect(router.url).toBe('/login'));
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('deletes the account, clears the session and navigates to login', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    localStorage.setItem('authToken', 'valid-token');
    renderHome();

    await user.click(await screen.findByTestId('delete-account-button'));

    expect(confirmSpy).toHaveBeenCalledWith('Delete this account? This cannot be undone.');
    await waitFor(() => expect(deleteAccountCalls()).toHaveLength(1));
    expect(deleteAccountCalls()[0][1]).toMatchObject({
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    });
    await waitFor(() => expect(router.url).toBe('/login'));
    expect(localStorage.getItem('authToken')).toBeNull();
    confirmSpy.mockRestore();
  });

  it('cancelling the confirm keeps the session and sends no delete request', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    localStorage.setItem('authToken', 'valid-token');
    renderHome();

    await user.click(await screen.findByTestId('delete-account-button'));

    expect(confirmSpy).toHaveBeenCalledOnce();
    expect(deleteAccountCalls()).toHaveLength(0);
    expect(router.url).toBe('/');
    expect(localStorage.getItem('authToken')).toBe('valid-token');
    confirmSpy.mockRestore();
  });

  // Mirrors logout: the local session goes even when the API refuses the token.
  it('clears the session when the delete call is rejected', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    localStorage.setItem('authToken', 'valid-token');
    stubDefaultApis((url, init) => {
      if (url.includes('/api/auth/me') && init?.method === 'DELETE') {
        return jsonResponse({ message: 'Unauthorized' }, false, 401);
      }
      return null;
    });

    renderHome();

    await user.click(await screen.findByTestId('delete-account-button'));

    await waitFor(() => expect(router.url).toBe('/login'));
    expect(localStorage.getItem('authToken')).toBeNull();
    confirmSpy.mockRestore();
  });

  it('clears an invalid session and keeps the welcome panel hidden', async () => {
    localStorage.setItem('authToken', 'bad-token');
    stubDefaultApis((url, init) => {
      if (url.includes('/api/auth/me') && init?.method !== 'DELETE') {
        return jsonResponse({ message: 'Unauthorized' }, false, 401);
      }
      return null;
    });

    renderHome();

    await waitFor(() => expect(localStorage.getItem('authToken')).toBeNull());
    expect(screen.getByTestId('welcome-panel')).not.toBeVisible();
  });
});
