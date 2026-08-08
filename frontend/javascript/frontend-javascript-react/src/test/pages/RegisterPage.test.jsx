import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterPage } from '../../pages/RegisterPage';

function jsonResponse(body, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<div data-testid="home-landed">home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mounts the register form with canonical title and controls', () => {
    renderRegister();

    expect(screen.getByTestId('register-panel')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-title')).toHaveTextContent('Register');
    expect(screen.getByTestId('login-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Register');
    expect(screen.getByTestId('login-link')).toBeInTheDocument();
  });

  it('redirects home when a session token is already present', async () => {
    localStorage.setItem('authToken', 'existing');
    renderRegister();

    expect(await screen.findByTestId('home-landed')).toBeInTheDocument();
  });

  it('shows the exact mismatch error when passwords differ', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByTestId('login-input'), 'newuser');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password124');
    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByTestId('error-message')).toHaveTextContent('Passwords do not match');
  });

  it('stores session and navigates home on successful register', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({ token: 'tok-reg', username: 'newuser', redirectUrl: '/' }, true, 201),
        ),
      ),
    );

    renderRegister();
    await user.type(screen.getByTestId('login-input'), 'newuser');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password123');
    await user.click(screen.getByTestId('submit-button'));

    expect(await screen.findByTestId('home-landed')).toBeInTheDocument();
    expect(localStorage.getItem('authToken')).toBe('tok-reg');
  });

  it('shows API error when username is already taken', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({ message: 'Username already taken' }, false, 409))),
    );

    renderRegister();
    await user.type(screen.getByTestId('login-input'), 'user1');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password123');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() =>
      expect(screen.getByTestId('error-message')).toHaveTextContent('Username already taken'),
    );
    expect(localStorage.getItem('authToken')).toBeNull();
  });
});
