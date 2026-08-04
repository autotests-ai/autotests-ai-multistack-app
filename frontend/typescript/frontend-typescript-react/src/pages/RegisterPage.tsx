import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Panel, PlaqueField } from '@zero-design-system/react';
import { REGISTER_MESSAGES } from '../lib/messages';
import {
  register,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from '../lib/auth';

export function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      setError(REGISTER_MESSAGES.errorPasswordMismatch ?? '');
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
          REGISTER_MESSAGES.errorRegistrationFailed ?? '',
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
              id="login-input"
              type="text"
              autoComplete="username"
              data-testid="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <PlaqueField
              label="Password"
              id="password-input"
              type="password"
              autoComplete="new-password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PlaqueField
              label="Confirm"
              id="confirm-password-input"
              type="password"
              autoComplete="new-password"
              data-testid="confirm-password-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <p id="error-message" className="auth-error" aria-live="polite" data-testid="error-message">
            {error}
          </p>

          <div className="auth-form__actions">
            <Button
              id="submit-button"
              type="submit"
              variant="primary"
              block
              data-testid="submit-button"
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
