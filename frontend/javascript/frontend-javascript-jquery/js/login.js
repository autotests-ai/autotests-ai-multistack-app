$(function () {
  var error = { type: 'none' };
  var activeLang = 'en';

  const $loginForm = $('[data-testid="login-form"]');
  const $loginInput = $('[data-testid="login-input"]');
  const $passwordInput = $('[data-testid="password-input"]');
  const $errorMessage = $('[data-testid="error-message"]');
  const $submitButton = $('[data-testid="submit-button"]');
  const $registerLink = $('[data-testid="register-link"]');

  function messages() {
    return window.I18n.loginMessages(activeLang);
  }

  function errorText() {
    var pack = messages();
    if (error.type === 'validation') {
      return (
        window.ReferenceAuth.validateCredentials(
          $loginInput.val().trim(),
          $passwordInput.val().trim(),
          pack,
        ) || ''
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

  function applyCopy(copy, code) {
    if (code) {
      activeLang = code;
    }
    $errorMessage.text(errorText());
    if ($registerLink.length) {
      $registerLink.attr('href', window.appPath('/register'));
    }
  }

  if (window.ReferenceAuth.getToken()) {
    window.location.replace(window.appPath('/'));
    return;
  }

  $loginForm.on('submit', async function (event) {
    event.preventDefault();
    error = { type: 'none' };
    $errorMessage.text('');

    const username = $loginInput.val().trim();
    const password = $passwordInput.val().trim();
    const pack = messages();
    const validationError = window.ReferenceAuth.validateCredentials(username, password, pack);
    if (validationError) {
      error = { type: 'validation' };
      $errorMessage.text(validationError);
      return;
    }

    $submitButton.prop('disabled', true);
    try {
      const response = await window.ReferenceAuth.login(username, password);
      window.ReferenceAuth.saveSession(response.token);
      window.location.href = response.redirectUrl || window.appPath('/');
    } catch (err) {
      var text = window.ReferenceAuth.resolveAuthErrorMessage(
        err,
        pack,
        pack.errorWrongCredentials,
      );
      if (err && err.network) {
        error = { type: 'network' };
      } else {
        error = { type: 'api', message: text };
      }
      $errorMessage.text(text);
    } finally {
      $submitButton.prop('disabled', false);
    }
  });

  window.startI18n(applyCopy);
});
