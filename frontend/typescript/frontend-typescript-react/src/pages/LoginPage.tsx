import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Panel, PlaqueField } from '@zero-design-system/react';
import { LOGIN_MESSAGES } from '../lib/messages';
import {
  getToken,
  login,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from '../lib/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    const validationError = validateCredentials(trimmedLogin, trimmedPassword, LOGIN_MESSAGES);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const response = await login(trimmedLogin, trimmedPassword);
      saveSession(response.token);
      navigate(response.redirectUrl || '/');
    } catch (err) {
      setError(
        resolveAuthErrorMessage(err, LOGIN_MESSAGES, LOGIN_MESSAGES.errorWrongCredentials ?? ''),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <Panel
        title="Login Form"
        titleTestId="login-form-title"
        testId="login-panel"
        className="auth-panel"
      >
        <form id="login-form" className="auth-form" data-testid="login-form" onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              Login
            </Button>
          </div>
        </form>

        <p className="auth-footer-link">
          No account?{' '}
          <Link to="/register" data-testid="register-link">
            Register
          </Link>
        </p>
      </Panel>
    </main>
  );
}
