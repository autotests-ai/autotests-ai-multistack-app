import { Button, Panel, PlaqueField } from '@zero-design-system/react';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import {
  getToken,
  login,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from '../lib/auth';
import { loginMessages } from '../lib/messages';

type LoginError =
  | { type: 'none' }
  | { type: 'validation' }
  | { type: 'network' }
  | { type: 'api'; message: string };

function loginErrorText(
  error: LoginError,
  username: string,
  password: string,
  messages: ReturnType<typeof loginMessages>,
): string {
  if (error.type === 'validation') {
    return validateCredentials(username.trim(), password.trim(), messages) ?? '';
  }
  if (error.type === 'network') {
    return messages.errorNetwork;
  }
  if (error.type === 'api') {
    return error.message;
  }
  return '';
}

export function LoginPage() {
  const navigate = useNavigate();
  const { lang, copy } = useI18n();
  const messages = loginMessages(lang);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<LoginError>({ type: 'none' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getToken()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError({ type: 'none' });

    const trimmedLogin = username.trim();
    const trimmedPassword = password.trim();
    const validationError = validateCredentials(trimmedLogin, trimmedPassword, messages);
    if (validationError) {
      setError({ type: 'validation' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await login(trimmedLogin, trimmedPassword);
      saveSession(response.token);
      navigate(response.redirectUrl || '/');
    } catch (err) {
      const text = resolveAuthErrorMessage(err, messages, messages.errorWrongCredentials!);
      if ((err as { network?: boolean } | undefined)?.network) {
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
        title={copy.login.title}
        titleTestId="login-form-title"
        testId="login-panel"
        className="auth-panel"
      >
        <form
          id="login-form"
          className="auth-form"
          data-testid="login-form"
          onSubmit={handleSubmit}
        >
          <div className="plaque-field-list">
            <PlaqueField
              label={copy.login.loginLabel}
              id="login-input"
              name="username"
              type="text"
              autoComplete="username"
              data-testid="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <PlaqueField
              label={copy.login.passwordLabel}
              id="password-input"
              name="password"
              type="password"
              autoComplete="current-password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <p
            id="error-message"
            className="auth-error"
            aria-live="polite"
            data-testid="error-message"
          >
            {loginErrorText(error, username, password, messages)}
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
              {copy.login.submit}
            </Button>
          </div>
        </form>

        <p className="auth-footer-link">
          {copy.login.noAccount}{' '}
          <Link to="/register" data-testid="register-link">
            {copy.login.registerLink}
          </Link>
        </p>
      </Panel>
    </main>
  );
}
