import $ from 'jquery';
import { appPath } from './appBase';
import {
  getToken,
  login,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from './auth';
import { mountHeader } from './headerConfig';
import { LOGIN_MESSAGES } from './messages';
import './styles';

function fieldValue($field: JQuery<HTMLElement>): string {
  return String($field.val() ?? '').trim();
}

$(() => {
  mountHeader('login');

  const $form = $('[data-testid="login-form"]');
  const $login = $('[data-testid="login-input"]');
  const $password = $('[data-testid="password-input"]');
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
    const validationError = validateCredentials(username, password, LOGIN_MESSAGES);
    if (validationError) {
      $error.text(validationError);
      return;
    }

    $submit.prop('disabled', true);
    try {
      const response = await login(username, password);
      saveSession(response.token);
      window.location.href = response.redirectUrl || appPath('/');
    } catch (error) {
      $error.text(
        resolveAuthErrorMessage(error, LOGIN_MESSAGES, LOGIN_MESSAGES.errorWrongCredentials ?? ''),
      );
    } finally {
      $submit.prop('disabled', false);
    }
  });
});
