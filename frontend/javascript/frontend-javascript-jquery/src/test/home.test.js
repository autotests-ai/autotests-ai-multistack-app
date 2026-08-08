import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createPageWindow,
  jsonResponse,
  loadAuthRuntime,
  loadJQuery,
  loadScript,
  mainMarkup,
  whenReady,
} from './helpers/page.js';

const HOME_MARKUP = mainMarkup('index.html');

let pageWindow;

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

async function renderHome() {
  document.body.innerHTML = HOME_MARKUP;
  loadAuthRuntime();
  pageWindow = createPageWindow();
  loadScript('js/app.js', pageWindow);
  await whenReady();
}

beforeAll(() => {
  loadJQuery();
});

beforeEach(() => {
  localStorage.clear();
  stubDefaultApis();
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('home page', () => {
  it('renders the reference layout with health and items from the API', async () => {
    await renderHome();

    expect(screen.getByTestId('reference-layout')).toBeInTheDocument();
    expect(screen.getByTestId('health-panel')).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByTestId('health-status')).toHaveTextContent(
        '→ UP | service: reference-app | frontend: frontend-javascript-jquery',
      ),
    );

    expect(await screen.findByTestId('item-row')).toHaveTextContent('Alpha');
    expect(screen.getByTestId('item-row')).toHaveTextContent('First item');
  });

  it('keeps the welcome panel hidden without a session token', async () => {
    await renderHome();

    await waitFor(() => expect(screen.getByTestId('item-row')).toBeInTheDocument());
    expect(screen.getByTestId('welcome-panel')).not.toBeVisible();
    expect(globalThis.fetch.mock.calls.map(([url]) => String(url))).not.toContain('/api/auth/me');
  });

  it('shows welcome, logout and delete account when profile loads for a session token', async () => {
    localStorage.setItem('authToken', 'valid-token');
    await renderHome();

    expect(await screen.findByTestId('welcome-message')).toHaveTextContent('Welcome, user1!');
    expect(screen.getByTestId('welcome-panel')).toBeVisible();
    expect(screen.getByTestId('logout-button')).toHaveTextContent('Logout');
    expect(screen.getByTestId('delete-account-button')).toHaveTextContent('Delete account');
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

  it('logs out and navigates to login', async () => {
    const user = userEvent.setup();
    localStorage.setItem('authToken', 'valid-token');
    await renderHome();

    await user.click(await screen.findByTestId('logout-button'));

    await waitFor(() => expect(pageWindow.location.href).toBe('/login'));
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('deletes the account, clears the session and navigates to login', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    localStorage.setItem('authToken', 'valid-token');
    await renderHome();

    await user.click(await screen.findByTestId('delete-account-button'));

    expect(confirmSpy).toHaveBeenCalledWith('Delete this account? This cannot be undone.');
    await waitFor(() => expect(deleteAccountCalls()).toHaveLength(1));
    expect(deleteAccountCalls()[0][1]).toMatchObject({
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    });
    await waitFor(() => expect(pageWindow.location.href).toBe('/login'));
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
    expect(pageWindow.location.href).not.toBe('/login');
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

    await waitFor(() => expect(pageWindow.location.href).toBe('/login'));
    expect(localStorage.getItem('authToken')).toBeNull();
    confirmSpy.mockRestore();
  });

  it('shows health error state when health API fails', async () => {
    stubDefaultApis((url) => {
      if (url.includes('/api/health')) {
        return jsonResponse({ message: 'down' }, false, 500);
      }
      return null;
    });

    await renderHome();

    await waitFor(() =>
      expect(screen.getByTestId('health-status')).toHaveTextContent('✗ health: HTTP 500'),
    );
    expect(screen.getByTestId('health-status')).toHaveClass('reference-app__error');
  });

  it('shows items error state when items API fails', async () => {
    stubDefaultApis((url) => {
      if (url.includes('/api/items')) {
        return jsonResponse({ message: 'boom' }, false, 500);
      }
      return null;
    });

    await renderHome();

    await waitFor(() =>
      expect(screen.getByTestId('items-list')).toHaveTextContent('✗ items: HTTP 500'),
    );
  });

  it('shows empty items state when API returns no rows', async () => {
    stubDefaultApis((url) => {
      if (url.includes('/api/items')) {
        return jsonResponse({ items: [] });
      }
      return null;
    });

    await renderHome();

    await waitFor(() =>
      expect(screen.getByTestId('items-list')).toHaveTextContent('No items found.'),
    );
    expect(screen.queryByTestId('item-row')).not.toBeInTheDocument();
  });
});
