import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../../pages/LoginPage';

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('mounts the login form with canonical title and controls', () => {
    renderLogin();

    expect(screen.getByTestId('login-panel')).toBeInTheDocument();
    expect(screen.getByTestId('login-form-title')).toHaveTextContent('Login Form');
    expect(screen.getByTestId('login-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Login');
    expect(screen.getByTestId('register-link')).toBeInTheDocument();
  });

  it('shows the exact login-required error when username is empty', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByTestId('password-input'), 'password1');
    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Login is required (minimum 3 characters)',
    );
  });

  it('shows the exact password-required error when password is empty', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByTestId('login-input'), 'user1');
    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Password is required (minimum 6 characters)',
    );
  });
});
