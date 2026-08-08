import $ from 'jquery';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchCalls,
  jsonResponse,
  type LocationStub,
  mountDocument,
  restoreLocation,
  stubApis,
  stubLocation,
  waitForPageReady,
} from './support/harness';

let locationStub: LocationStub;

async function renderLogin(): Promise<void> {
  mountDocument('login.html');
  vi.resetModules();
  await import('../login');
  await waitForPageReady();
}

function $testId(testId: string): JQuery<HTMLElement> {
  return $(`[data-testid="${testId}"]`);
}

function fillCredentials(username: string, password: string): void {
  $testId('login-input').val(username);
  $testId('password-input').val(password);
}

function submit(): void {
  $testId('login-form').trigger('submit');
}

describe('login', () => {
  beforeEach(() => {
    localStorage.clear();
    locationStub = stubLocation('/login');
    stubApis();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    restoreLocation();
  });

  it('mounts the login form with canonical title and controls', async () => {
    await renderLogin();

    expect($testId('login-panel')).toHaveLength(1);
    expect($testId('login-form-title').text()).toBe('Login Form');
    expect($testId('login-input').attr('name')).toBe('username');
    expect($testId('password-input').attr('name')).toBe('password');
    expect($testId('submit-button').text()).toBe('Login');
    expect($testId('register-link').attr('href')).toBe('register');
    expect(window.headerConfig?.nav.find((item) => item.testid === 'header-nav-login')?.active).toBe(
      true,
    );
  });

  it('shows the exact login-required error when username is empty', async () => {
    await renderLogin();

    fillCredentials('', 'password1');
    submit();

    expect($testId('error-message').text()).toBe('Login is required (minimum 3 characters)');
    expect(fetchCalls('POST', '/api/auth/login')).toHaveLength(0);
  });

  it('shows the exact password-required error when password is empty', async () => {
    await renderLogin();

    fillCredentials('user1', '');
    submit();

    expect($testId('error-message').text()).toBe('Password is required (minimum 6 characters)');
    expect(fetchCalls('POST', '/api/auth/login')).toHaveLength(0);
  });

  it('stores the session and follows the redirect on success', async () => {
    await renderLogin();

    fillCredentials('user1', 'password1');
    submit();

    await vi.waitFor(() => {
      expect(locationStub.href).toBe('/');
    });
    expect(localStorage.getItem('authToken')).toBe('jwt-login');
    expect(fetchCalls('POST', '/api/auth/login')[0][1]).toMatchObject({
      body: JSON.stringify({ username: 'user1', password: 'password1' }),
    });
  });

  it('shows the API message for wrong credentials and re-enables the button', async () => {
    stubApis((url) =>
      url.includes('/api/auth/login')
        ? jsonResponse({ message: 'Wrong login or password' }, false, 401)
        : null,
    );
    await renderLogin();

    fillCredentials('user1', 'password1');
    submit();

    await vi.waitFor(() => {
      expect($testId('error-message').text()).toBe('Wrong login or password');
    });
    expect($testId('submit-button').prop('disabled')).toBe(false);
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('shows the network copy when the request never reaches the API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('connection refused')));
    await renderLogin();

    fillCredentials('user1', 'password1');
    submit();

    await vi.waitFor(() => {
      expect($testId('error-message').text()).toBe(
        'Network error. Check your connection and try again.',
      );
    });
  });

  it('redirects home when a session token is already stored', async () => {
    localStorage.setItem('authToken', 'valid-token');

    await renderLogin();

    expect(locationStub.replace).toHaveBeenCalledWith('/');
  });
});
