import { Button, Panel, PlaqueField } from '@zero-design-system/react';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getToken,
  register,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from '../lib/auth';
import { REGISTER_MESSAGES } from '../lib/messages';

export function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getToken()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const trimmedLogin = username.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    const validationError = validateCredentials(trimmedLogin, trimmedPassword, REGISTER_MESSAGES);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (trimmedPassword !== trimmedConfirm) {
      setError(REGISTER_MESSAGES.errorPasswordMismatch!);
      return;
    }

    setSubmitting(true);
    try {
      const response = await register(trimmedLogin, trimmedPassword);
      saveSession(response.token);
      navigate(response.redirectUrl || '/');
    } catch (err) {
      setError(
        resolveAuthErrorMessage(
          err,
          REGISTER_MESSAGES,
          REGISTER_MESSAGES.errorRegistrationFailed!,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <Panel
        title="Register"
        titleTestId="register-form-title"
        testId="register-panel"
        className="auth-panel"
      >
        <form
          id="register-form"
          className="auth-form"
          data-testid="register-form"
          onSubmit={handleSubmit}
        >
          <div className="plaque-field-list">
            <PlaqueField
              label="Login"
              id="register-login-input"
              name="username"
              type="text"
              autoComplete="username"
              data-testid="register-login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <PlaqueField
              label="Password"
              id="register-password-input"
              name="password"
              type="password"
              autoComplete="new-password"
              data-testid="register-password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PlaqueField
              label="Confirm"
              id="confirm-password-input"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              data-testid="confirm-password-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <p
            id="register-error-message"
            className="auth-error"
            aria-live="polite"
            data-testid="register-error-message"
          >
            {error}
          </p>

          <div className="auth-form__actions">
            <Button
              id="register-submit-button"
              type="submit"
              variant="primary"
              block
              data-testid="register-submit-button"
              disabled={submitting}
            >
              Register
            </Button>
          </div>
        </form>

        <p className="auth-footer-link">
          Already have an account?{' '}
          <Link to="/login" data-testid="login-link">
            Login
          </Link>
        </p>
      </Panel>
    </main>
  );
}
