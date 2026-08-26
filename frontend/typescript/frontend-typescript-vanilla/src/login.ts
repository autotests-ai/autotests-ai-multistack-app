import { appPath } from './appBase';
import {
  getToken,
  login,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from './auth';
import { mountHeader } from './header';
import { loginMessages, startI18n } from './i18n';

type ErrorState =
  | { type: 'none' }
  | { type: 'validation' }
  | { type: 'network' }
  | { type: 'api'; message: string };

const loginForm = document.querySelector<HTMLFormElement>('#login-form');
const loginInput = document.querySelector<HTMLInputElement>('#login-input');
const passwordInput = document.querySelector<HTMLInputElement>('#password-input');
const errorMessage = document.querySelector<HTMLElement>('#error-message');
const submitButton = document.querySelector<HTMLButtonElement>('#submit-button');
const registerLink = document.querySelector<HTMLAnchorElement>('[data-testid="register-link"]');

let error: ErrorState = { type: 'none' };

function messages() {
  return loginMessages();
}

function errorText(): string {
  const pack = messages();
  if (error.type === 'validation' && loginInput && passwordInput) {
    return (
      validateCredentials(loginInput.value.trim(), passwordInput.value.trim(), pack) || ''
    );
  }
  if (error.type === 'network') {
    return pack.errorNetwork;
  }
  if (error.type === 'api') {
    return error.message;
  }
  return '';
}

function applyCopy(): void {
  if (errorMessage) {
    errorMessage.textContent = errorText();
  }
  if (registerLink) {
    registerLink.setAttribute('href', appPath('/register'));
  }
}

mountHeader('/login');

if (getToken()) {
  window.location.replace(appPath('/'));
} else if (loginForm && loginInput && passwordInput && errorMessage && submitButton) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    error = { type: 'none' };
    errorMessage.textContent = '';

    const username = loginInput.value.trim();
    const password = passwordInput.value.trim();
    const pack = messages();
    const validationError = validateCredentials(username, password, pack);
    if (validationError) {
      error = { type: 'validation' };
      errorMessage.textContent = validationError;
      return;
    }

    submitButton.disabled = true;
    try {
      const response = await login(username, password);
      saveSession(response.token);
      window.location.href = response.redirectUrl || appPath('/');
    } catch (err) {
      const text = resolveAuthErrorMessage(err, pack, pack.errorWrongCredentials ?? '');
      error =
        err instanceof Error && 'network' in err && (err as { network?: boolean }).network
          ? { type: 'network' }
          : { type: 'api', message: text };
      errorMessage.textContent = text;
    } finally {
      submitButton.disabled = false;
    }
  });

  startI18n(applyCopy);
}
