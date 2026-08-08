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

async function renderRegister(): Promise<void> {
  mountDocument('register.html');
  vi.resetModules();
  await import('../register');
  await waitForPageReady();
}

function $testId(testId: string): JQuery<HTMLElement> {
  return $(`[data-testid="${testId}"]`);
}

function fillForm(username: string, password: string, confirmPassword: string): void {
  $testId('login-input').val(username);
  $testId('password-input').val(password);
  $testId('confirm-password-input').val(confirmPassword);
}

function submit(): void {
  $testId('register-form').trigger('submit');
}

describe('register', () => {
  beforeEach(() => {
    localStorage.clear();
    locationStub = stubLocation('/register');
    stubApis();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    restoreLocation();
  });

  it('mounts the register form with the confirm field and login link', async () => {
    await renderRegister();

    expect($testId('register-panel')).toHaveLength(1);
    expect($testId('register-form-title').text()).toBe('Register');
    expect($testId('confirm-password-input').attr('name')).toBe('confirm-password');
    expect($testId('submit-button').text()).toBe('Register');
    expect($testId('login-link').attr('href')).toBe('login');
    expect(
      window.headerConfig?.nav.find((item) => item.testid === 'header-nav-register')?.active,
    ).toBe(true);
  });

  it('rejects mismatched passwords without calling the API', async () => {
    await renderRegister();

    fillForm('user1', 'password1', 'password2');
    submit();

    expect($testId('error-message').text()).toBe('Passwords do not match');
    expect(fetchCalls('POST', '/api/auth/register')).toHaveLength(0);
  });

  it('shows the shared validation copy for a short login', async () => {
    await renderRegister();

    fillForm('ab', 'password1', 'password1');
    submit();

    expect($testId('error-message').text()).toBe('Login must be at least 3 characters');
    expect(fetchCalls('POST', '/api/auth/register')).toHaveLength(0);
  });

  it('stores the session and follows the redirect on success', async () => {
    await renderRegister();

    fillForm('user1', 'password1', 'password1');
    submit();

    await vi.waitFor(() => {
      expect(locationStub.href).toBe('/');
    });
    expect(localStorage.getItem('authToken')).toBe('jwt-register');
    expect(fetchCalls('POST', '/api/auth/register')[0][1]).toMatchObject({
      body: JSON.stringify({ username: 'user1', password: 'password1' }),
    });
  });

  it('shows the API message when the username is taken', async () => {
    stubApis((url) =>
      url.includes('/api/auth/register')
        ? jsonResponse({ message: 'Username already taken' }, false, 409)
        : null,
    );
    await renderRegister();

    fillForm('user1', 'password1', 'password1');
    submit();

    await vi.waitFor(() => {
      expect($testId('error-message').text()).toBe('Username already taken');
    });
    expect($testId('submit-button').prop('disabled')).toBe(false);
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('redirects home when a session token is already stored', async () => {
    localStorage.setItem('authToken', 'valid-token');

    await renderRegister();

    expect(locationStub.replace).toHaveBeenCalledWith('/');
  });
});
