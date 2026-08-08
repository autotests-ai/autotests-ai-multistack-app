$(function () {
  const MESSAGES = {
    errorBothRequired: "Login and password are required (minimum {minLogin} and {minPassword} characters)",
    errorLoginRequired: "Login is required (minimum {minLogin} characters)",
    errorLoginMinLength: "Login must be at least {minLogin} characters",
    errorPasswordRequired: "Password is required (minimum {minPassword} characters)",
    errorPasswordMinLength: "Password must be at least {minPassword} characters",
    errorPasswordMismatch: "Passwords do not match",
    errorNetwork: "Network error. Check your connection and try again.",
    errorRegistrationFailed: "Registration failed",
  };

  const $registerForm = $('[data-testid="register-form"]');
  const $loginInput = $('[data-testid="login-input"]');
  const $passwordInput = $('[data-testid="password-input"]');
  const $confirmPasswordInput = $('[data-testid="confirm-password-input"]');
  const $errorMessage = $('[data-testid="error-message"]');
  const $submitButton = $('[data-testid="submit-button"]');

  if (window.ReferenceAuth.getToken()) {
    window.location.replace(window.appPath("/"));
  }

  $registerForm.on("submit", async function (event) {
    event.preventDefault();
    $errorMessage.text("");

    const username = $loginInput.val().trim();
    const password = $passwordInput.val().trim();
    const confirmPassword = $confirmPasswordInput.val().trim();

    const validationError = window.ReferenceAuth.validateCredentials(username, password, MESSAGES);
    if (validationError) {
      $errorMessage.text(validationError);
      return;
    }
    if (password !== confirmPassword) {
      $errorMessage.text(MESSAGES.errorPasswordMismatch);
      return;
    }

    $submitButton.prop("disabled", true);
    try {
      const response = await window.ReferenceAuth.register(username, password);
      window.ReferenceAuth.saveSession(response.token);
      window.location.href = response.redirectUrl || window.appPath("/");
    } catch (error) {
      $errorMessage.text(
        window.ReferenceAuth.resolveAuthErrorMessage(
          error,
          MESSAGES,
          MESSAGES.errorRegistrationFailed
        )
      );
    } finally {
      $submitButton.prop("disabled", false);
    }
  });
});
