import { appPath } from './appBase';
import {
  getToken,
  register,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from './auth';
import { mountHeader } from './header';
import { REGISTER_MESSAGES } from './messages';

const registerForm = document.querySelector<HTMLFormElement>('#register-form');
const loginInput = document.querySelector<HTMLInputElement>('#login-input');
const passwordInput = document.querySelector<HTMLInputElement>('#password-input');
const confirmPasswordInput = document.querySelector<HTMLInputElement>('#confirm-password-input');
const errorMessage = document.querySelector<HTMLElement>('#error-message');
const submitButton = document.querySelector<HTMLButtonElement>('#submit-button');

mountHeader('/register');

if (getToken()) {
  window.location.replace(appPath('/'));
}

if (
  registerForm &&
  loginInput &&
  passwordInput &&
  confirmPasswordInput &&
  errorMessage &&
  submitButton
) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorMessage.textContent = '';

    const username = loginInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    const validationError = validateCredentials(username, password, REGISTER_MESSAGES);
    if (validationError) {
      errorMessage.textContent = validationError;
      return;
    }
    if (password !== confirmPassword) {
      errorMessage.textContent = REGISTER_MESSAGES.errorPasswordMismatch ?? '';
      return;
    }

    submitButton.disabled = true;
    try {
      const response = await register(username, password);
      saveSession(response.token);
      window.location.href = response.redirectUrl || appPath('/');
    } catch (error) {
      errorMessage.textContent = resolveAuthErrorMessage(
        error,
        REGISTER_MESSAGES,
        REGISTER_MESSAGES.errorRegistrationFailed ?? '',
      );
    } finally {
      submitButton.disabled = false;
    }
  });
}
