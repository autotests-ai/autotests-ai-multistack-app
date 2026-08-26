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

async function renderRegister(): Promise<void> {
  vi.resetModules();
  await import('../../register');
}

function submit(username: string, password: string, confirmPassword: string): void {
  testId<HTMLInputElement>('login-input').value = username;
  testId<HTMLInputElement>('password-input').value = password;
  testId<HTMLInputElement>('confirm-password-input').value = confirmPassword;
  testId('register-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

describe('register page', () => {
  beforeEach(() => {
    localStorage.clear();
    location = stubLocation('/register');
    loadPage('register.html');
    stubReferenceApi((url) =>
      url.includes('/api/auth/register')
        ? jsonResponse({ token: 'fresh-token', username: 'user1', redirectUrl: '/' }, true, 201)
        : null,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    restoreLocation();
  });

  it('renders the register panel with a confirm field and a link to login', async () => {
    await renderRegister();

    expect(testId('register-panel')).toBeInTheDocument();
    expect(testId('register-form-title')).toHaveTextContent('Register');
    expect(testId('confirm-password-input')).toHaveAttribute('type', 'password');
    expect(testId('login-link')).toHaveAttribute('href', '/login');
  });

  it('redirects home when a session token is already stored', async () => {
    localStorage.setItem('authToken', 'valid-token');

    await renderRegister();

    expect(location.replace).toHaveBeenCalledWith('/');
  });

  it('validates credentials before the passwords are compared', async () => {
    await renderRegister();

    submit('ab', 'password1', 'password2');

    await waitFor(() =>
      expect(testId('error-message')).toHaveTextContent('Login must be at least 3 characters'),
    );
    expect(fetchCalls('/api/auth/register')).toHaveLength(0);
  });

  it('rejects mismatched passwords without calling the API', async () => {
    await renderRegister();

    submit('user1', 'password1', 'password2');

    await waitFor(() =>
      expect(testId('error-message')).toHaveTextContent('Passwords do not match'),
    );
    expect(fetchCalls('/api/auth/register')).toHaveLength(0);
  });

  it('stores the token and follows the redirect on success', async () => {
    await renderRegister();

    submit('user1', 'password1', 'password1');

    await waitFor(() => expect(location.href).toBe('/'));
    expect(fetchCalls('/api/auth/register', 'POST')).toHaveLength(1);
    expect(localStorage.getItem('authToken')).toBe('fresh-token');
  });

  it('shows the API message when the username is taken', async () => {
    stubReferenceApi((url) =>
      url.includes('/api/auth/register')
        ? jsonResponse({ message: 'Username already exists' }, false, 409)
        : null,
    );
    await renderRegister();

    submit('user1', 'password1', 'password1');

    await waitFor(() =>
      expect(testId('error-message')).toHaveTextContent('Username already exists'),
    );
    expect(testId<HTMLButtonElement>('submit-button').disabled).toBe(false);
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('falls back to the registration failed copy when the API sends no message', async () => {
    stubReferenceApi((url) =>
      url.includes('/api/auth/register') ? jsonResponse({}, false, 500) : null,
    );
    await renderRegister();

    submit('user1', 'password1', 'password1');

    await waitFor(() => expect(testId('error-message')).toHaveTextContent('Request failed'));
  });

  it('shows the network error copy when the request never lands', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('connection refused')));
    await renderRegister();

    submit('user1', 'password1', 'password1');

    await waitFor(() =>
      expect(testId('error-message')).toHaveTextContent(
        'Network error. Check your connection and try again.',
      ),
    );
    expect(location.href).toBe('');
  });
});
