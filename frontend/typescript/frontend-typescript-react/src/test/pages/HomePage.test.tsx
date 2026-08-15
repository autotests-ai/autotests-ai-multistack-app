import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { HomePage } from '../../pages/HomePage';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

function renderHome(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<div data-testid="login-landed">login</div>} />
      </Routes>
    </MemoryRouter>,
  );
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
        return Promise.resolve({ ok: true, status: 204, json: async () => ({}) } as Response);
      }
      if (url.includes('/api/auth/me')) {
        return Promise.resolve(jsonResponse({ username: 'user1' }));
      }
      if (url.includes('/api/auth/logout')) {
        return Promise.resolve({ ok: true, status: 204, json: async () => ({}) } as Response);
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
    vi.unstubAllGlobals();
  });

  it('renders the reference layout with health and items from the API', async () => {
    renderHome();

    expect(screen.getByTestId('reference-layout')).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByTestId('health-status')).toHaveTextContent(
        '→ UP | service: backend-java-spring | frontend: frontend-typescript-react',
      ),
    );

    expect(await screen.findByTestId('item-row')).toHaveTextContent('Alpha');
  });

  it('keeps the welcome panel hidden without a session token', async () => {
    renderHome();

    await waitFor(() => expect(screen.getByTestId('item-row')).toBeInTheDocument());
    expect(screen.getByTestId('welcome-panel')).not.toBeVisible();
  });

  it('shows welcome, logout and delete account when profile loads for a session token', async () => {
    localStorage.setItem('authToken', 'valid-token');
    renderHome();

    expect(await screen.findByTestId('welcome-message')).toHaveTextContent('Welcome, user1!');
    expect(screen.getByTestId('welcome-panel')).toBeVisible();
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    expect(screen.getByTestId('delete-account-button')).toHaveTextContent('Delete account');
  });

  it('clears invalid session and keeps welcome hidden', async () => {
    localStorage.setItem('authToken', 'bad-token');
    stubDefaultApis((url) => {
      if (url.includes('/api/auth/me')) {
        return jsonResponse({ message: 'Unauthorized' }, false, 401);
      }
      return null;
    });

    renderHome();

    await waitFor(() => expect(screen.getByTestId('item-row')).toBeInTheDocument());
    expect(screen.getByTestId('welcome-panel')).not.toBeVisible();
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('does not clear session after unmount when profile fetch fails', async () => {
    localStorage.setItem('authToken', 'stale-token');
    let rejectProfile!: (reason?: unknown) => void;
    const profilePromise = new Promise<Response>((_resolve, reject) => {
      rejectProfile = reject;
    });

    stubDefaultApis((url) => {
      if (url.includes('/api/auth/me')) {
        return profilePromise;
      }
      return null;
    });

    const { unmount } = renderHome();
    await waitFor(() => expect(screen.getByTestId('item-row')).toBeInTheDocument());
    unmount();
    rejectProfile(new Error('aborted'));
    await Promise.resolve();

    expect(localStorage.getItem('authToken')).toBe('stale-token');
  });

  it('logs out and navigates to login', async () => {
    const user = userEvent.setup();
    localStorage.setItem('authToken', 'valid-token');
    renderHome();

    await screen.findByTestId('logout-button');
    await user.click(screen.getByTestId('logout-button'));

    expect(await screen.findByTestId('login-landed')).toBeInTheDocument();
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('deletes the account, clears the session and navigates to login', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    localStorage.setItem('authToken', 'valid-token');
    renderHome();

    await screen.findByTestId('delete-account-button');
    await user.click(screen.getByTestId('delete-account-button'));

    expect(confirmSpy).toHaveBeenCalledWith('Delete this account? This cannot be undone.');
    expect(deleteAccountCalls()).toHaveLength(1);
    expect(deleteAccountCalls()[0][1]).toMatchObject({
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    });
    expect(await screen.findByTestId('login-landed')).toBeInTheDocument();
    expect(localStorage.getItem('authToken')).toBeNull();
    confirmSpy.mockRestore();
  });

  it('cancelling the confirm keeps the session and sends no delete request', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    localStorage.setItem('authToken', 'valid-token');
    renderHome();

    await screen.findByTestId('delete-account-button');
    await user.click(screen.getByTestId('delete-account-button'));

    expect(confirmSpy).toHaveBeenCalledOnce();
    expect(deleteAccountCalls()).toHaveLength(0);
    expect(screen.queryByTestId('login-landed')).not.toBeInTheDocument();
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

    await screen.findByTestId('delete-account-button');
    await user.click(screen.getByTestId('delete-account-button'));

    expect(await screen.findByTestId('login-landed')).toBeInTheDocument();
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

    renderHome();

    await waitFor(() =>
      expect(screen.getByTestId('health-status')).toHaveTextContent('✗ health: HTTP 500'),
    );
  });

  it('shows items error state when items API fails', async () => {
    stubDefaultApis((url) => {
      if (url.includes('/api/items')) {
        return jsonResponse({ message: 'boom' }, false, 500);
      }
      return null;
    });

    renderHome();

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

    renderHome();

    await waitFor(() =>
      expect(screen.getByTestId('items-list')).toHaveTextContent('No items found.'),
    );
  });
});
