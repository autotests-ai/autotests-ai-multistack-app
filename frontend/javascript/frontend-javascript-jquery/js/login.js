$(function () {
  const MESSAGES = {
    errorBothRequired: "Login and password are required (minimum {minLogin} and {minPassword} characters)",
    errorLoginRequired: "Login is required (minimum {minLogin} characters)",
    errorLoginMinLength: "Login must be at least {minLogin} characters",
    errorPasswordRequired: "Password is required (minimum {minPassword} characters)",
    errorPasswordMinLength: "Password must be at least {minPassword} characters",
    errorWrongCredentials: "Wrong login or password",
    errorNetwork: "Network error. Check your connection and try again.",
  };

  const $loginForm = $('[data-testid="login-form"]');
  const $loginInput = $('[data-testid="login-input"]');
  const $passwordInput = $('[data-testid="password-input"]');
  const $errorMessage = $('[data-testid="error-message"]');
  const $submitButton = $('[data-testid="submit-button"]');

  if (window.ReferenceAuth.getToken()) {
    window.location.replace(window.appPath("/"));
  }

  $loginForm.on("submit", async function (event) {
    event.preventDefault();
    $errorMessage.text("");

    const username = $loginInput.val().trim();
    const password = $passwordInput.val().trim();
    const validationError = window.ReferenceAuth.validateCredentials(username, password, MESSAGES);
    if (validationError) {
      $errorMessage.text(validationError);
      return;
    }

    $submitButton.prop("disabled", true);
    try {
      const response = await window.ReferenceAuth.login(username, password);
      window.ReferenceAuth.saveSession(response.token);
      window.location.href = response.redirectUrl || window.appPath("/");
    } catch (error) {
      $errorMessage.text(
        window.ReferenceAuth.resolveAuthErrorMessage(
          error,
          MESSAGES,
          MESSAGES.errorWrongCredentials
        )
      );
    } finally {
      $submitButton.prop("disabled", false);
    }
  });
});
