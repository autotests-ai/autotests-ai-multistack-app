import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HEADER_LANG_CHANGE, ru } from '../../i18n';
import { RegisterPage } from '../../pages/RegisterPage';

function dispatchLang(lang: string) {
  act(() => {
    document.dispatchEvent(new CustomEvent(HEADER_LANG_CHANGE, { detail: { lang } }));
  });
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<div data-testid="home-landed">home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mounts the register form with canonical title and controls', () => {
    renderRegister();

    expect(screen.getByTestId('register-panel')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-title')).toHaveTextContent('Register');
    expect(screen.getByTestId('register-login-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-submit-button')).toHaveTextContent('Register');
    expect(screen.getByTestId('login-link')).toBeInTheDocument();
  });

  it('redirects home when a session token is already present', async () => {
    localStorage.setItem('authToken', 'existing');
    renderRegister();

    expect(await screen.findByTestId('home-landed')).toBeInTheDocument();
  });

  it('shows validation error when login is too short', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByTestId('register-login-input'), 'ab');
    await user.type(screen.getByTestId('register-password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password123');
    await user.click(screen.getByTestId('register-submit-button'));

    expect(screen.getByTestId('register-error-message')).toHaveTextContent(
      'Login must be at least 3 characters',
    );
  });

  it('shows the exact mismatch error when passwords differ', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByTestId('register-login-input'), 'newuser');
    await user.type(screen.getByTestId('register-password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password124');
    await user.click(screen.getByTestId('register-submit-button'));

    expect(screen.getByTestId('register-error-message')).toHaveTextContent(
      'Passwords do not match',
    );
  });

  it('navigates to / when register succeeds without redirectUrl', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(jsonResponse({ token: 'tok-reg', username: 'newuser' }, true, 201)),
      ),
    );

    renderRegister();
    await user.type(screen.getByTestId('register-login-input'), 'newuser');
    await user.type(screen.getByTestId('register-password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password123');
    await user.click(screen.getByTestId('register-submit-button'));

    expect(await screen.findByTestId('home-landed')).toBeInTheDocument();
    expect(localStorage.getItem('authToken')).toBe('tok-reg');
  });

  it('stores session and navigates home on successful register', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({ token: 'tok-reg', username: 'newuser', redirectUrl: '/' }, true, 201),
        ),
      ),
    );

    renderRegister();
    await user.type(screen.getByTestId('register-login-input'), 'newuser');
    await user.type(screen.getByTestId('register-password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password123');
    await user.click(screen.getByTestId('register-submit-button'));

    expect(await screen.findByTestId('home-landed')).toBeInTheDocument();
    expect(localStorage.getItem('authToken')).toBe('tok-reg');
  });

  it('shows API error when username is already taken', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({ message: 'Username already taken' }, false, 409))),
    );

    renderRegister();
    await user.type(screen.getByTestId('register-login-input'), 'user1');
    await user.type(screen.getByTestId('register-password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password123');
    await user.click(screen.getByTestId('register-submit-button'));

    await waitFor(() =>
      expect(screen.getByTestId('register-error-message')).toHaveTextContent(
        'Username already taken',
      ),
    );
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('shows the network message when the request never reaches the API', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    renderRegister();
    await user.type(screen.getByTestId('register-login-input'), 'newuser');
    await user.type(screen.getByTestId('register-password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password123');
    await user.click(screen.getByTestId('register-submit-button'));

    await waitFor(() =>
      expect(screen.getByTestId('register-error-message')).toHaveTextContent(
        'Network error. Check your connection and try again.',
      ),
    );
  });

  it('switches visible copy on header:lang-change', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByTestId('register-login-input'), 'newuser');
    await user.type(screen.getByTestId('register-password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password124');
    await user.click(screen.getByTestId('register-submit-button'));
    expect(screen.getByTestId('register-error-message')).toHaveTextContent(
      'Passwords do not match',
    );

    dispatchLang('ru');

    expect(screen.getByTestId('register-form-title')).toHaveTextContent(ru.register.title);
    expect(screen.getByTestId('register-submit-button')).toHaveTextContent(ru.register.submit);
    expect(screen.getByTestId('login-link')).toHaveTextContent(ru.register.loginLink);
    expect(screen.getByTestId('register-error-message')).toHaveTextContent(
      ru.register.errorPasswordMismatch,
    );
  });

  it('retranslates a validation error and clears it when fields become valid', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByTestId('register-login-input'), 'ab');
    await user.type(screen.getByTestId('register-password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password123');
    await user.click(screen.getByTestId('register-submit-button'));
    expect(screen.getByTestId('register-error-message')).toHaveTextContent(
      'Login must be at least 3 characters',
    );

    dispatchLang('ru');
    expect(screen.getByTestId('register-error-message')).toHaveTextContent(
      'Логин должен быть не короче 3 символов',
    );

    await user.type(screen.getByTestId('register-login-input'), 'c');
    expect(screen.getByTestId('register-error-message')).toHaveTextContent('');
  });
});
