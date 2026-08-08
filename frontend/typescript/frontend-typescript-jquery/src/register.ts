import $ from 'jquery';
import { appPath } from './appBase';
import {
  getToken,
  register,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from './auth';
import { mountHeader } from './headerConfig';
import { REGISTER_MESSAGES } from './messages';
import './styles';

function fieldValue($field: JQuery<HTMLElement>): string {
  return String($field.val() ?? '').trim();
}

$(() => {
  mountHeader('register');

  const $form = $('[data-testid="register-form"]');
  const $login = $('[data-testid="login-input"]');
  const $password = $('[data-testid="password-input"]');
  const $confirmPassword = $('[data-testid="confirm-password-input"]');
  const $error = $('[data-testid="error-message"]');
  const $submit = $('[data-testid="submit-button"]');

  if (getToken()) {
    window.location.replace(appPath('/'));
  }

  $form.on('submit', async (event) => {
    event.preventDefault();
    $error.text('');

    const username = fieldValue($login);
    const password = fieldValue($password);
    const confirmPassword = fieldValue($confirmPassword);

    const validationError = validateCredentials(username, password, REGISTER_MESSAGES);
    if (validationError) {
      $error.text(validationError);
      return;
    }
    if (password !== confirmPassword) {
      $error.text(REGISTER_MESSAGES.errorPasswordMismatch ?? '');
      return;
    }

    $submit.prop('disabled', true);
    try {
      const response = await register(username, password);
      saveSession(response.token);
      window.location.href = response.redirectUrl || appPath('/');
    } catch (error) {
      $error.text(
        resolveAuthErrorMessage(
          error,
          REGISTER_MESSAGES,
          REGISTER_MESSAGES.errorRegistrationFailed ?? '',
        ),
      );
    } finally {
      $submit.prop('disabled', false);
    }
  });
});
