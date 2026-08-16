import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchCalls,
  jsonResponse,
  loadPage,
  restoreLocation,
  stubLocation,
  settle,
  stubReferenceApi,
  testId,
  waitFor,
  type LocationStub,
} from '../harness';

let location: LocationStub;

/** index.html runs `src/home.ts` on load; the module reads the DOM at import. */
async function renderHome(): Promise<void> {
  vi.resetModules();
  await import('../../home');
}

describe('home page', { tags: ['smoke'] }, () => {
  beforeEach(() => {
    localStorage.clear();
    location = stubLocation('/');
    loadPage('index.html');
    stubReferenceApi();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    restoreLocation();
  });

  it('renders the reference layout with health and items from the API', async () => {
    await renderHome();

    expect(testId('multistack-layout')).toBeInTheDocument();

    await waitFor(() =>
      expect(testId('health-status')).toHaveTextContent(
        '→ UP | service: backend-java-spring | frontend: frontend-typescript-vanilla',
      ),
    );
    await waitFor(() => expect(testId('item-row')).toHaveTextContent('Alpha'));
    expect(testId('item-row')).toHaveTextContent('First item');
  });

  it('keeps the session panel hidden without a session token', async () => {
    await renderHome();

    await waitFor(() => expect(testId('item-row')).toBeInTheDocument());
    await settle();
    expect(testId('welcome-panel')).not.toBeVisible();
    expect(fetchCalls('/api/auth/me')).toHaveLength(0);
  });

  it('shows welcome, logout and delete account when profile loads for a session token', async () => {
    localStorage.setItem('authToken', 'valid-token');

    await renderHome();

    await waitFor(() => expect(testId('welcome-message')).toHaveTextContent('Welcome, user1!'));
    expect(testId('welcome-panel')).toBeVisible();
    expect(testId('logout-button')).toHaveTextContent('Logout');
    expect(testId('delete-account-button')).toHaveTextContent('Delete account');
  });

  it('clears an invalid session and keeps the panel hidden', async () => {
    localStorage.setItem('authToken', 'bad-token');
    stubReferenceApi((url) =>
      url.includes('/api/auth/me') ? jsonResponse({ message: 'Unauthorized' }, false, 401) : null,
    );

    await renderHome();

    await waitFor(() => expect(localStorage.getItem('authToken')).toBeNull());
    expect(testId('welcome-panel')).not.toBeVisible();
  });

  it('logs out and navigates to login', async () => {
    localStorage.setItem('authToken', 'valid-token');
    await renderHome();
    await waitFor(() => expect(testId('welcome-panel')).toBeVisible());

    testId('logout-button').click();

    await waitFor(() => expect(location.href).toBe('/login'));
    expect(fetchCalls('/api/auth/logout', 'POST')).toHaveLength(1);
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('deletes the account, clears the session and navigates to login', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    localStorage.setItem('authToken', 'valid-token');
    await renderHome();
    await waitFor(() => expect(testId('welcome-panel')).toBeVisible());

    testId('delete-account-button').click();

    await waitFor(() => expect(location.href).toBe('/login'));
    expect(confirmSpy).toHaveBeenCalledWith('Delete this account? This cannot be undone.');
    expect(fetchCalls('/api/auth/me', 'DELETE')).toHaveLength(1);
    expect(fetchCalls('/api/auth/me', 'DELETE')[0][1]).toMatchObject({
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    });
    expect(fetchCalls('/api/auth/logout')).toHaveLength(0);
    expect(localStorage.getItem('authToken')).toBeNull();
    confirmSpy.mockRestore();
  });

  it('cancelling the confirm keeps the session and sends no delete request', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    localStorage.setItem('authToken', 'valid-token');
    await renderHome();
    await waitFor(() => expect(testId('welcome-panel')).toBeVisible());

    testId('delete-account-button').click();
    await settle();

    expect(confirmSpy).toHaveBeenCalledOnce();
    expect(fetchCalls('/api/auth/me', 'DELETE')).toHaveLength(0);
    expect(location.href).toBe('');
    expect(localStorage.getItem('authToken')).toBe('valid-token');
    confirmSpy.mockRestore();
  });

  // Mirrors logout: the local session goes even when the API refuses the token.
  it('clears the session when the delete call is rejected', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    localStorage.setItem('authToken', 'valid-token');
    stubReferenceApi((url, init) =>
      url.includes('/api/auth/me') && init?.method === 'DELETE'
        ? jsonResponse({ message: 'Unauthorized' }, false, 401)
        : null,
    );
    await renderHome();
    await waitFor(() => expect(testId('welcome-panel')).toBeVisible());

    testId('delete-account-button').click();

    await waitFor(() => expect(location.href).toBe('/login'));
    expect(localStorage.getItem('authToken')).toBeNull();
    confirmSpy.mockRestore();
  });

  it('shows the health error state when the health API fails', async () => {
    stubReferenceApi((url) =>
      url.includes('/api/health') ? jsonResponse({ message: 'down' }, false, 500) : null,
    );

    await renderHome();

    await waitFor(() => expect(testId('health-status')).toHaveTextContent('✗ health: HTTP 500'));
    expect(testId('health-status')).toHaveClass('multistack__error');
  });

  it('shows the items error state when the items API fails', async () => {
    stubReferenceApi((url) =>
      url.includes('/api/items') ? jsonResponse({ message: 'boom' }, false, 500) : null,
    );

    await renderHome();

    await waitFor(() => expect(testId('items-list')).toHaveTextContent('✗ items: HTTP 500'));
  });

  it('shows the empty items state when the API returns no rows', async () => {
    stubReferenceApi((url) => (url.includes('/api/items') ? jsonResponse({ items: [] }) : null));

    await renderHome();

    await waitFor(() => expect(testId('items-list')).toHaveTextContent('No items found.'));
    expect(document.querySelector('[data-testid="item-row"]')).toBeNull();
  });
});
