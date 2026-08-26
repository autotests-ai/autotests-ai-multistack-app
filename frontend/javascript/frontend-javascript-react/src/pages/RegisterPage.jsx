import { Button, Panel, PlaqueField } from '@zero-design-system/react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import {
  getToken,
  register,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from '../lib/auth';
import { registerMessages } from '../lib/messages';

function registerErrorText(error, username, password, messages) {
  if (error.type === 'validation') {
    return validateCredentials(username.trim(), password.trim(), messages) ?? '';
  }
  if (error.type === 'mismatch') {
    return messages.errorPasswordMismatch;
  }
  if (error.type === 'network') {
    return messages.errorNetwork;
  }
  if (error.type === 'api') {
    return error.message;
  }
  return '';
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { lang, copy } = useI18n();
  const messages = registerMessages(lang);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState({ type: 'none' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getToken()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError({ type: 'none' });

    const trimmedLogin = username.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    const validationError = validateCredentials(trimmedLogin, trimmedPassword, messages);
    if (validationError) {
      setError({ type: 'validation' });
      return;
    }
    if (trimmedPassword !== trimmedConfirm) {
      setError({ type: 'mismatch' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await register(trimmedLogin, trimmedPassword);
      saveSession(response.token);
      navigate(response.redirectUrl || '/');
    } catch (err) {
      const text = resolveAuthErrorMessage(err, messages, messages.errorRegistrationFailed);
      if (err?.network) {
        setError({ type: 'network' });
      } else {
        setError({ type: 'api', message: text });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <Panel
        title={copy.register.title}
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
              label={copy.register.loginLabel}
              id="login-input"
              name="username"
              type="text"
              autoComplete="username"
              data-testid="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <PlaqueField
              label={copy.register.passwordLabel}
              id="password-input"
              name="password"
              type="password"
              autoComplete="new-password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PlaqueField
              label={copy.register.confirmLabel}
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
            id="error-message"
            className="auth-error"
            aria-live="polite"
            data-testid="error-message"
          >
            {registerErrorText(error, username, password, messages)}
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
              {copy.register.submit}
            </Button>
          </div>
        </form>

        <p className="auth-footer-link">
          {copy.register.haveAccount}{' '}
          <Link to="/login" data-testid="login-link">
            {copy.register.loginLink}
          </Link>
        </p>
      </Panel>
    </main>
  );
}
