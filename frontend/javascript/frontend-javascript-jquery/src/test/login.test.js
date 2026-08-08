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

const LOGIN_MARKUP = mainMarkup('login.html');

let pageWindow;

async function renderLogin() {
  document.body.innerHTML = LOGIN_MARKUP;
  loadAuthRuntime();
  pageWindow = createPageWindow();
  loadScript('js/login.js', pageWindow);
  await whenReady();
}

async function submitCredentials(user, username, password) {
  if (username) await user.type(screen.getByTestId('login-input'), username);
  if (password) await user.type(screen.getByTestId('password-input'), password);
  await user.click(screen.getByTestId('submit-button'));
}

beforeAll(() => {
  loadJQuery();
});

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('login page', () => {
  it('renders the login panel and the register link', async () => {
    await renderLogin();

    expect(screen.getByTestId('login-panel')).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('register-link')).toHaveAttribute('href', 'register');
  });

  it('redirects home when a session token is already stored', async () => {
    localStorage.setItem('authToken', 'valid-token');

    await renderLogin();

    expect(pageWindow.location.href).toBe('/');
  });

  it('shows the validation error and sends no request for empty credentials', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await renderLogin();

    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Login and password are required (minimum 3 and 6 characters)',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the exact login-required error when username is empty', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await renderLogin();

    await submitCredentials(user, '', 'password1');

    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Login is required (minimum 3 characters)',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the exact password-required error when password is empty', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await renderLogin();

    await submitCredentials(user, 'user1', '');

    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Password is required (minimum 6 characters)',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('stores the token and follows the redirect the API returns', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ token: 'token-123', username: 'user1', redirectUrl: '/' }),
      ),
    );
    await renderLogin();

    await submitCredentials(user, 'user1', 'password1');

    await waitFor(() => expect(localStorage.getItem('authToken')).toBe('token-123'));
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'user1', password: 'password1' }),
    });
    expect(pageWindow.location.href).toBe('/');
  });

  it('shows the API message for wrong credentials and keeps the session empty', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ message: 'Wrong login or password' }, false, 401)),
    );
    await renderLogin();

    await submitCredentials(user, 'user1', 'password1');

    await waitFor(() =>
      expect(screen.getByTestId('error-message')).toHaveTextContent('Wrong login or password'),
    );
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(screen.getByTestId('submit-button')).not.toBeDisabled();
  });

  it('shows the network error copy when the request never lands', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await renderLogin();

    await submitCredentials(user, 'user1', 'password1');

    await waitFor(() =>
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Network error. Check your connection and try again.',
      ),
    );
  });
});
