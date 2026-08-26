import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createPageWindow,
  dispatchLang,
  jsonResponse,
  loadJQuery,
  loadPageRuntime,
  loadScript,
  mainMarkup,
  whenReady,
} from './helpers/page.js';

const REGISTER_MARKUP = mainMarkup('register.html');

let pageWindow;

async function renderRegister() {
  document.body.innerHTML = REGISTER_MARKUP;
  loadPageRuntime();
  pageWindow = createPageWindow();
  loadScript('js/register.js', pageWindow);
  await whenReady();
}

async function fillForm(user, { username, password, confirmPassword }) {
  await user.type(screen.getByTestId('login-input'), username);
  await user.type(screen.getByTestId('password-input'), password);
  await user.type(screen.getByTestId('confirm-password-input'), confirmPassword);
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
  document.documentElement.lang = 'en';
  document.documentElement.classList.remove('theme-light');
});

describe('register page', () => {
  it('renders the register panel, the confirm field and the login link', async () => {
    await renderRegister();

    expect(screen.getByTestId('register-panel')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-link')).toHaveAttribute('href', '/login');
  });

  it('redirects home when a session token is already stored', async () => {
    localStorage.setItem('authToken', 'valid-token');

    await renderRegister();

    expect(pageWindow.location.href).toBe('/');
  });

  it('rejects mismatched passwords without calling the API', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await renderRegister();

    await fillForm(user, {
      username: 'user1',
      password: 'password1',
      confirmPassword: 'password2',
    });

    expect(screen.getByTestId('error-message')).toHaveTextContent('Passwords do not match');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('registers, stores the token and follows the redirect the API returns', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ token: 'token-456', username: 'user1', redirectUrl: '/' }, true, 201),
        ),
    );
    await renderRegister();

    await fillForm(user, {
      username: 'user1',
      password: 'password1',
      confirmPassword: 'password1',
    });

    await waitFor(() => expect(localStorage.getItem('authToken')).toBe('token-456'));
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'user1', password: 'password1' }),
    });
    expect(pageWindow.location.href).toBe('/');
  });

  it('shows the API message when registration is refused', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ message: 'Username already taken' }, false, 409)),
    );
    await renderRegister();

    await fillForm(user, {
      username: 'user1',
      password: 'password1',
      confirmPassword: 'password1',
    });

    await waitFor(() =>
      expect(screen.getByTestId('error-message')).toHaveTextContent('Username already taken'),
    );
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(screen.getByTestId('submit-button')).not.toBeDisabled();
  });

  it('reads zds-lang after a second render', async () => {
    localStorage.setItem('zds-lang', 'ru');
    await renderRegister();
    expect(screen.getByTestId('register-form-title')).toHaveTextContent(
      window.I18n.ru.register.title,
    );
    expect(document.documentElement.lang).toBe('ru');

    document.body.innerHTML = '';
    await renderRegister();
    expect(screen.getByTestId('register-form-title')).toHaveTextContent(
      window.I18n.ru.register.title,
    );
  });

  it('keeps theme-light on html when language changes', async () => {
    document.documentElement.classList.add('theme-light');
    await renderRegister();
    dispatchLang('ru');
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    expect(document.documentElement.lang).toBe('ru');
  });

  it('retranslates register chrome and mismatch copy on header:lang-change', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await renderRegister();

    await fillForm(user, {
      username: 'user1',
      password: 'password1',
      confirmPassword: 'password2',
    });
    expect(screen.getByTestId('error-message')).toHaveTextContent('Passwords do not match');

    dispatchLang('ru');

    expect(screen.getByTestId('register-form-title')).toHaveTextContent(window.I18n.ru.register.title);
    expect(screen.getByTestId('submit-button')).toHaveTextContent(window.I18n.ru.register.submit);
    expect(screen.getByTestId('login-link')).toHaveTextContent(window.I18n.ru.register.loginLink);
    expect(screen.getByTestId('confirm-password-input')).toHaveAttribute(
      'data-testid',
      'confirm-password-input',
    );
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      window.I18n.ru.register.errorPasswordMismatch,
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.documentElement.lang).toBe('ru');
  });

  it('does not translate refused-registration API payloads', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ message: 'Username already taken' }, false, 409)),
    );
    await renderRegister();

    await fillForm(user, {
      username: 'user1',
      password: 'password1',
      confirmPassword: 'password1',
    });
    await waitFor(() =>
      expect(screen.getByTestId('error-message')).toHaveTextContent('Username already taken'),
    );

    dispatchLang('ru');
    expect(screen.getByTestId('register-form-title')).toHaveTextContent(window.I18n.ru.register.title);
    expect(screen.getByTestId('error-message')).toHaveTextContent('Username already taken');
  });
});
