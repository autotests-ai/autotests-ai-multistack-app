import { ApplicationRef, Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterPageComponent } from '../../app/pages/register.component';
import { HEADER_LANG_CHANGE, ru } from '../../i18n';
import { RouterTestingHarness } from '@angular/router/testing';

@Component({ template: '' })
class BlankComponent {}

async function renderRegister(): Promise<{ router: Router }> {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', component: BlankComponent },
        { path: 'login', component: BlankComponent },
        { path: 'register', component: RegisterPageComponent },
      ]),
    ],
  });
  const harness = await RouterTestingHarness.create('/register');
  harness.fixture.autoDetectChanges();
  return { router: TestBed.inject(Router) };
}

function dispatchLang(lang: string) {
  document.dispatchEvent(new CustomEvent(HEADER_LANG_CHANGE, { detail: { lang } }));
  TestBed.inject(ApplicationRef).tick();
}

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
    document.documentElement.lang = 'en';
  });

  it('mounts the register form with canonical title and controls', async () => {
    await renderRegister();

    expect(screen.getByTestId('register-panel')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-title')).toHaveTextContent('Register');
    expect(screen.getByTestId('login-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Register');
    expect(screen.getByTestId('login-link')).toBeInTheDocument();
  });

  it('shows the exact mismatch error when passwords differ', async () => {
    const user = userEvent.setup();
    await renderRegister();

    await user.type(screen.getByTestId('login-input'), 'newuser');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password124');
    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByTestId('error-message')).toHaveTextContent('Passwords do not match');
  });

  it('saves the session and follows redirectUrl on a successful registration', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({ token: 'new-token', username: 'newuser', redirectUrl: '/' }),
        }),
      ),
    );
    const { router } = await renderRegister();

    await user.type(screen.getByTestId('login-input'), 'newuser');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password123');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => expect(localStorage.getItem('authToken')).toBe('new-token'));
    await waitFor(() => expect(router.url).toBe('/'));
  });

  it('shows the API message when the login is already taken', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({ message: 'Login already exists' }),
        }),
      ),
    );
    await renderRegister();

    await user.type(screen.getByTestId('login-input'), 'newuser');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password123');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() =>
      expect(screen.getByTestId('error-message')).toHaveTextContent('Login already exists'),
    );
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('redirects an already signed-in visitor to home', async () => {
    localStorage.setItem('authToken', 'valid-token');
    const { router } = await renderRegister();

    await waitFor(() => expect(router.url).toBe('/'));
  });

  it('switches visible copy on header:lang-change', async () => {
    const user = userEvent.setup();
    await renderRegister();

    await user.type(screen.getByTestId('login-input'), 'newuser');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password124');
    await user.click(screen.getByTestId('submit-button'));
    expect(screen.getByTestId('error-message')).toHaveTextContent('Passwords do not match');

    dispatchLang('ru');

    expect(screen.getByTestId('register-form-title')).toHaveTextContent(ru.register.title);
    expect(screen.getByTestId('submit-button')).toHaveTextContent(ru.register.submit);
    expect(screen.getByTestId('login-link')).toHaveTextContent(ru.register.loginLink);
    expect(screen.getByTestId('error-message')).toHaveTextContent(ru.register.errorPasswordMismatch);
  });

  it('retranslates a validation error and clears it when fields become valid', async () => {
    const user = userEvent.setup();
    await renderRegister();

    await user.type(screen.getByTestId('login-input'), 'ab');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password123');
    await user.click(screen.getByTestId('submit-button'));
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Login must be at least 3 characters',
    );

    dispatchLang('ru');
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Логин должен быть не короче 3 символов',
    );

    await user.type(screen.getByTestId('login-input'), 'c');
    expect(screen.getByTestId('error-message')).toHaveTextContent('');
  });
});
