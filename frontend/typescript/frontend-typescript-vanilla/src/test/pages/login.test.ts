import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchCalls,
  jsonResponse,
  loadPage,
  restoreLocation,
  stubLocation,
  stubReferenceApi,
  testId,
  waitFor,
  type LocationStub,
} from '../harness';

let location: LocationStub;

async function renderLogin(): Promise<void> {
  vi.resetModules();
  await import('../../login');
}

function submit(username: string, password: string): void {
  testId<HTMLInputElement>('login-input').value = username;
  testId<HTMLInputElement>('password-input').value = password;
  testId('login-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('login page', () => {
  beforeEach(() => {
    localStorage.clear();
    location = stubLocation('/login');
    loadPage('login.html');
    stubReferenceApi((url) =>
      url.includes('/api/auth/login')
        ? jsonResponse({ token: 'fresh-token', username: 'user1', redirectUrl: '/' })
        : null,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    restoreLocation();
  });

  it('renders the login panel with a link to register', async () => {
    await renderLogin();

    expect(testId('login-panel')).toBeInTheDocument();
    expect(testId('login-form-title')).toHaveTextContent('Login Form');
    expect(testId('register-link')).toHaveAttribute('href', 'register');
  });

  it('redirects home when a session token is already stored', async () => {
    localStorage.setItem('authToken', 'valid-token');

    await renderLogin();

    expect(location.replace).toHaveBeenCalledWith('/');
  });

  it('rejects empty credentials without calling the API', async () => {
    await renderLogin();

    submit('', '');

    await waitFor(() =>
      expect(testId('error-message')).toHaveTextContent(
        'Login and password are required (minimum 3 and 6 characters)',
      ),
    );
    expect(fetchCalls('/api/auth/login')).toHaveLength(0);
  });

  it('shows the exact login-required error when username is empty', async () => {
    await renderLogin();

    submit('', 'password1');

    await waitFor(() =>
      expect(testId('error-message')).toHaveTextContent(
        'Login is required (minimum 3 characters)',
      ),
    );
    expect(fetchCalls('/api/auth/login')).toHaveLength(0);
  });

  it('shows the exact password-required error when password is empty', async () => {
    await renderLogin();

    submit('user1', '');

    await waitFor(() =>
      expect(testId('error-message')).toHaveTextContent(
        'Password is required (minimum 6 characters)',
      ),
    );
    expect(fetchCalls('/api/auth/login')).toHaveLength(0);
  });

  it('rejects a short password without calling the API', async () => {
    await renderLogin();

    submit('user1', '123');

    await waitFor(() =>
      expect(testId('error-message')).toHaveTextContent('Password must be at least 6 characters'),
    );
    expect(fetchCalls('/api/auth/login')).toHaveLength(0);
  });
  it('stores the token and follows the redirect on success', async () => {
    await renderLogin();

    submit('  user1  ', 'password1');

    await waitFor(() => expect(location.href).toBe('/'));
    expect(fetchCalls('/api/auth/login', 'POST')[0][1]).toMatchObject({
      body: JSON.stringify({ username: 'user1', password: 'password1' }),
    });
    expect(localStorage.getItem('authToken')).toBe('fresh-token');
  });

  it('falls back to the mount root when the API sends no redirectUrl', async () => {
    stubReferenceApi((url) =>
      url.includes('/api/auth/login')
        ? jsonResponse({ token: 'fresh-token', username: 'user1' })
        : null,
    );
    await renderLogin();

    submit('user1', 'password1');

    await waitFor(() => expect(location.href).toBe('/'));
  });

  it('shows the API message on wrong credentials and re-enables submit', async () => {
    stubReferenceApi((url) =>
      url.includes('/api/auth/login')
        ? jsonResponse({ message: 'Wrong login or password' }, false, 401)
        : null,
    );
    await renderLogin();

    submit('user1', 'password1');

    await waitFor(() =>
      expect(testId('error-message')).toHaveTextContent('Wrong login or password'),
    );
    expect(testId<HTMLButtonElement>('submit-button').disabled).toBe(false);
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('shows the network error copy when the request never lands', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('connection refused')));
    await renderLogin();

    submit('user1', 'password1');

    await waitFor(() =>
      expect(testId('error-message')).toHaveTextContent(
        'Network error. Check your connection and try again.',
      ),
    );
    expect(location.href).toBe('');
  });
});
