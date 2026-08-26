(function () {
  var error = { type: 'none' };

  var loginForm = document.getElementById('login-form');
  var loginInput = document.getElementById('login-input');
  var passwordInput = document.getElementById('password-input');
  var errorMessage = document.getElementById('error-message');
  var submitButton = document.getElementById('submit-button');
  var registerLink = document.querySelector('[data-testid="register-link"]');

  function messages() {
    return I18n.loginMessages(I18n.readStoredLang());
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
    if (registerLink) {
      registerLink.setAttribute('href', appPath('/register'));
    }
  }

  if (ReferenceAuth.getToken()) {
    window.location.replace(appPath('/'));
    return;
  }

  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    error = { type: 'none' };
    errorMessage.textContent = '';

    var username = loginInput.value.trim();
    var password = passwordInput.value.trim();
    var pack = messages();
    var validationError = ReferenceAuth.validateCredentials(username, password, pack);
    if (validationError) {
      error = { type: 'validation' };
      errorMessage.textContent = validationError;
      return;
    }

    submitButton.disabled = true;
    try {
      var response = await ReferenceAuth.login(username, password);
      ReferenceAuth.saveSession(response.token);
      window.location.href = response.redirectUrl || appPath('/');
    } catch (err) {
      var text = ReferenceAuth.resolveAuthErrorMessage(err, pack, pack.errorWrongCredentials);
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
