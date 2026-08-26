(function () {
  var error = { type: 'none' };

  var registerForm = document.getElementById('register-form');
  var loginInput = document.getElementById('register-login-input');
  var passwordInput = document.getElementById('register-password-input');
  var confirmPasswordInput = document.getElementById('confirm-password-input');
  var errorMessage = document.getElementById('register-error-message');
  var submitButton = document.getElementById('register-submit-button');
  var loginLink = document.querySelector('[data-testid="login-link"]');

  function messages() {
    return I18n.registerMessages(I18n.readStoredLang());
  }

  function errorText() {
    var pack = messages();
    if (error.type === 'validation') {
      return (
        ReferenceAuth.validateCredentials(
          loginInput.value.trim(),
          passwordInput.value.trim(),
          pack,
        ) || ''
      );
    }
    if (error.type === 'mismatch') {
      return pack.errorPasswordMismatch;
    }
    if (error.type === 'network') {
      return pack.errorNetwork;
    }
    if (error.type === 'api') {
      return error.message;
    }
    return '';
  }

  function applyCopy() {
    errorMessage.textContent = errorText();
    if (loginLink) {
      loginLink.setAttribute('href', appPath('/login'));
    }
  }

  if (ReferenceAuth.getToken()) {
    window.location.replace(appPath('/'));
    return;
  }

  registerForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    error = { type: 'none' };
    errorMessage.textContent = '';

    var username = loginInput.value.trim();
    var password = passwordInput.value.trim();
    var confirmPassword = confirmPasswordInput.value.trim();
    var pack = messages();

    var validationError = ReferenceAuth.validateCredentials(username, password, pack);
    if (validationError) {
      error = { type: 'validation' };
      errorMessage.textContent = validationError;
      return;
    }
    if (password !== confirmPassword) {
      error = { type: 'mismatch' };
      errorMessage.textContent = pack.errorPasswordMismatch;
      return;
    }

    submitButton.disabled = true;
    try {
      var response = await ReferenceAuth.register(username, password);
      ReferenceAuth.saveSession(response.token);
      window.location.href = response.redirectUrl || appPath('/');
    } catch (err) {
      var text = ReferenceAuth.resolveAuthErrorMessage(
        err,
        pack,
        pack.errorRegistrationFailed,
      );
      if (err && err.network) {
        error = { type: 'network' };
      } else {
        error = { type: 'api', message: text };
      }
      errorMessage.textContent = text;
    } finally {
      submitButton.disabled = false;
    }
  });

  startI18n(applyCopy);
})();
