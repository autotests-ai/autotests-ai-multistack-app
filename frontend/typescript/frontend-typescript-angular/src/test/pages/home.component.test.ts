import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { HomePageComponent } from '../../app/pages/home.component';

@Component({ template: '' })
class LoginStubComponent {}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

async function renderHome() {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', component: HomePageComponent },
        { path: 'login', component: LoginStubComponent },
      ]),
    ],
  });
  const harness = await RouterTestingHarness.create('/');
  harness.fixture.autoDetectChanges();
  return harness;
}

function currentUrl(): string {
  return TestBed.inject(Router).url;
}

function stubDefaultApis(
  overrides?: (url: string, init?: RequestInit) => Response | Promise<Response> | null,
) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const override = overrides?.(url, init);
      if (override) return Promise.resolve(override);

      if (url.includes('/api/health')) {
        return Promise.resolve(jsonResponse({ status: 'UP', service: 'backend-java-spring' }));
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

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

function deleteAccountCalls() {
  return (globalThis.fetch as unknown as FetchMock).mock.calls.filter(
    ([input, init]) => String(input).includes('/api/auth/me') && init?.method === 'DELETE',
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear();
    stubDefaultApis();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('renders the reference layout with health and items from the API', async () => {
    await renderHome();

    expect(screen.getByTestId('multistack-layout')).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByTestId('health-status')).toHaveTextContent(
        '→ UP | service: backend-java-spring | frontend: frontend-typescript-angular',
      ),
    );

    expect(await screen.findByTestId('item-row')).toHaveTextContent('Alpha');
  });

  it('keeps the welcome panel hidden without a session token', async () => {
    await renderHome();

    await waitFor(() => expect(screen.getByTestId('item-row')).toBeInTheDocument());
    expect(screen.getByTestId('welcome-panel')).not.toBeVisible();
  });

  it('shows welcome, logout and delete account when profile loads for a session token', async () => {
    localStorage.setItem('authToken', 'valid-token');
    await renderHome();

    await waitFor(() =>
      expect(screen.getByTestId('welcome-message')).toHaveTextContent('Welcome, user1!'),
    );
    expect(screen.getByTestId('welcome-panel')).toBeVisible();
    expect(screen.getByTestId('logout-button')).toHaveTextContent('Logout');
    expect(screen.getByTestId('delete-account-button')).toHaveTextContent('Delete account');
  });

  // Design-system classes the Selenide suites and the other nine modules share.
  it('renders the session panel with the canonical design-system markup', async () => {
    localStorage.setItem('authToken', 'valid-token');
    await renderHome();

    await waitFor(() => expect(screen.getByTestId('welcome-message')).toBeInTheDocument());
    expect(screen.getByTestId('welcome-panel')).toHaveClass('panel', 'panel--content');
    expect(screen.getByTestId('welcome-message').parentElement).toHaveClass(
      'panel__body',
      'multistack__welcome-body',
    );
    expect(screen.getByTestId('logout-button')).toHaveClass('btn', 'btn--primary');
    expect(screen.getByTestId('delete-account-button')).toHaveClass('btn', 'btn--danger');
  });

  it('logs out and navigates to login', async () => {
    const user = userEvent.setup();
    localStorage.setItem('authToken', 'valid-token');
    await renderHome();

    await user.click(await screen.findByTestId('logout-button'));

    await waitFor(() => expect(currentUrl()).toBe('/login'));
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('deletes the account, clears the session and navigates to login', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    localStorage.setItem('authToken', 'valid-token');
    await renderHome();

    await user.click(await screen.findByTestId('delete-account-button'));

    expect(confirmSpy).toHaveBeenCalledWith('Delete this account? This cannot be undone.');
    expect(deleteAccountCalls()).toHaveLength(1);
    expect(deleteAccountCalls()[0][1]).toMatchObject({
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    });
    await waitFor(() => expect(currentUrl()).toBe('/login'));
    expect(localStorage.getItem('authToken')).toBeNull();
    confirmSpy.mockRestore();
  });

  it('cancelling the confirm keeps the session and sends no delete request', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    localStorage.setItem('authToken', 'valid-token');
    await renderHome();

    await user.click(await screen.findByTestId('delete-account-button'));

    expect(confirmSpy).toHaveBeenCalledOnce();
    expect(deleteAccountCalls()).toHaveLength(0);
    expect(currentUrl()).toBe('/');
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

    await renderHome();

    await user.click(await screen.findByTestId('delete-account-button'));

    await waitFor(() => expect(currentUrl()).toBe('/login'));
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

    await renderHome();

    await waitFor(() => expect(localStorage.getItem('authToken')).toBeNull());
    expect(screen.getByTestId('welcome-panel')).not.toBeVisible();
  });

  it('shows the empty state when the API returns no items', async () => {
    stubDefaultApis((url) => (url.includes('/api/items') ? jsonResponse({ items: [] }) : null));

    await renderHome();

    await waitFor(() =>
      expect(screen.getByTestId('items-list')).toHaveTextContent('No items found.'),
    );
  });

  it('reports health and items failures with the canonical prefixes', async () => {
    stubDefaultApis((url) => {
      if (url.includes('/api/health')) return jsonResponse({}, false, 503);
      if (url.includes('/api/items')) return jsonResponse({}, false, 500);
      return null;
    });

    await renderHome();

    await waitFor(() =>
      expect(screen.getByTestId('health-status')).toHaveTextContent('✗ health: HTTP 503'),
    );
    expect(screen.getByTestId('items-list')).toHaveTextContent('✗ items: HTTP 500');
  });
});
