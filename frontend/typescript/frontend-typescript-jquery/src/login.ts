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
import { loginMessages, startI18n, type Dictionary, type Lang } from './i18n';
import './styles';

type ErrorState =
  | { type: 'none' }
  | { type: 'validation' }
  | { type: 'network' }
  | { type: 'api'; message: string };

function fieldValue($field: JQuery<HTMLElement>): string {
  return String($field.val() ?? '').trim();
}

$(() => {
  mountHeader('login');

  if (getToken()) {
    window.location.replace(appPath('/'));
    return;
  }

  const $form = $('[data-testid="login-form"]');
  const $login = $('[data-testid="login-input"]');
  const $password = $('[data-testid="password-input"]');
  const $error = $('[data-testid="error-message"]');
  const $submit = $('[data-testid="submit-button"]');
  const $registerLink = $('[data-testid="register-link"]');

  let lang: Lang = 'en';
  let error: ErrorState = { type: 'none' };

  function messages() {
    return loginMessages(lang);
  }

  function errorText(): string {
    const pack = messages();
    if (error.type === 'validation') {
      return validateCredentials(fieldValue($login), fieldValue($password), pack) ?? '';
    }
    if (error.type === 'network') {
      return pack.errorNetwork;
    }
    if (error.type === 'api') {
      return error.message;
    }
    return '';
  }

  function applyCopy(_copy: Dictionary, next: Lang): void {
    lang = next;
    $error.text(errorText());
    $registerLink.attr('href', appPath('/register'));
  }

  $form.on('submit', async (event) => {
    event.preventDefault();
    error = { type: 'none' };
    $error.text('');

    const username = fieldValue($login);
    const password = fieldValue($password);
    const pack = messages();
    const validationError = validateCredentials(username, password, pack);
    if (validationError) {
      error = { type: 'validation' };
      $error.text(validationError);
      return;
    }

    $submit.prop('disabled', true);
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
      $error.text(text);
    } finally {
      $submit.prop('disabled', false);
    }
  });

  startI18n(applyCopy);
});
