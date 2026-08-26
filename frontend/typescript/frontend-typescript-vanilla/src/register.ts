import { appPath } from './appBase';
import {
  getToken,
  register,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from './auth';
import { mountHeader } from './header';
import { registerMessages, startI18n } from './i18n';

type ErrorState =
  | { type: 'none' }
  | { type: 'validation' }
  | { type: 'mismatch' }
  | { type: 'network' }
  | { type: 'api'; message: string };

const registerForm = document.querySelector<HTMLFormElement>('#register-form');
const loginInput = document.querySelector<HTMLInputElement>('#login-input');
const passwordInput = document.querySelector<HTMLInputElement>('#password-input');
const confirmPasswordInput = document.querySelector<HTMLInputElement>('#confirm-password-input');
const errorMessage = document.querySelector<HTMLElement>('#error-message');
const submitButton = document.querySelector<HTMLButtonElement>('#submit-button');
const loginLink = document.querySelector<HTMLAnchorElement>('[data-testid="login-link"]');

let error: ErrorState = { type: 'none' };

function messages() {
  return registerMessages();
}

function errorText(): string {
  const pack = messages();
  if (error.type === 'validation' && loginInput && passwordInput) {
    return (
      validateCredentials(loginInput.value.trim(), passwordInput.value.trim(), pack) || ''
    );
  }
  if (error.type === 'mismatch') {
    return pack.errorPasswordMismatch ?? '';
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
  if (loginLink) {
    loginLink.setAttribute('href', appPath('/login'));
  }
}

mountHeader('/register');

if (getToken()) {
  window.location.replace(appPath('/'));
} else if (
  registerForm &&
  loginInput &&
  passwordInput &&
  confirmPasswordInput &&
  errorMessage &&
  submitButton
) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    error = { type: 'none' };
    errorMessage.textContent = '';

    const username = loginInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    const pack = messages();

    const validationError = validateCredentials(username, password, pack);
    if (validationError) {
      error = { type: 'validation' };
      errorMessage.textContent = validationError;
      return;
    }
    if (password !== confirmPassword) {
      error = { type: 'mismatch' };
      errorMessage.textContent = pack.errorPasswordMismatch ?? '';
      return;
    }

    submitButton.disabled = true;
    try {
      const response = await register(username, password);
      saveSession(response.token);
      window.location.href = response.redirectUrl || appPath('/');
    } catch (err) {
      const text = resolveAuthErrorMessage(
        err,
        pack,
        pack.errorRegistrationFailed ?? '',
      );
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
