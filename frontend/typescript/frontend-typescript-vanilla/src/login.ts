import { appPath } from './appBase';
import {
  getToken,
  login,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from './auth';
import { mountHeader } from './header';
import { LOGIN_MESSAGES } from './messages';

const loginForm = document.querySelector<HTMLFormElement>('#login-form');
const loginInput = document.querySelector<HTMLInputElement>('#login-input');
const passwordInput = document.querySelector<HTMLInputElement>('#password-input');
const errorMessage = document.querySelector<HTMLElement>('#error-message');
const submitButton = document.querySelector<HTMLButtonElement>('#submit-button');

mountHeader('/login');

if (getToken()) {
  window.location.replace(appPath('/'));
}

if (loginForm && loginInput && passwordInput && errorMessage && submitButton) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorMessage.textContent = '';

    const username = loginInput.value.trim();
    const password = passwordInput.value.trim();
    const validationError = validateCredentials(username, password, LOGIN_MESSAGES);
    if (validationError) {
      errorMessage.textContent = validationError;
      return;
    }

    submitButton.disabled = true;
    try {
      const response = await login(username, password);
      saveSession(response.token);
      window.location.href = response.redirectUrl || appPath('/');
    } catch (error) {
      errorMessage.textContent = resolveAuthErrorMessage(
        error,
        LOGIN_MESSAGES,
        LOGIN_MESSAGES.errorWrongCredentials ?? '',
      );
    } finally {
      submitButton.disabled = false;
    }
  });
}
