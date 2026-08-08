import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, createRouter } from 'vue-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterPage from '../../pages/RegisterPage.vue';

async function renderRegister() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div data-testid="home-landed" />' } },
      { path: '/login', component: { template: '<div />' } },
      { path: '/register', component: RegisterPage },
    ],
  });
  await router.push('/register');
  await router.isReady();
  render(RegisterPage, { global: { plugins: [router] } });
  return router;
}

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mounts the register form with canonical title and controls', async () => {
    await renderRegister();

    expect(screen.getByTestId('register-panel')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-title')).toHaveTextContent('Register');
    expect(screen.getByTestId('login-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Register');
    expect(screen.getByTestId('login-link')).toBeInTheDocument();
  });

  it('shows the exact mismatch error when passwords differ', async () => {
    const user = userEvent.setup();
    await renderRegister();

    await user.type(screen.getByTestId('login-input'), 'newuser');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password124');
    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByTestId('error-message')).toHaveTextContent('Passwords do not match');
  });

  it('saves the session and follows redirectUrl on a successful registration', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({ token: 'new-token', username: 'newuser', redirectUrl: '/' }),
        }),
      ),
    );
    const router = await renderRegister();

    await user.type(screen.getByTestId('login-input'), 'newuser');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password123');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => expect(localStorage.getItem('authToken')).toBe('new-token'));
    await waitFor(() => expect(router.currentRoute.value.path).toBe('/'));
  });

  it('shows the API message when the login is already taken', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({ message: 'Login already exists' }),
        }),
      ),
    );
    await renderRegister();

    await user.type(screen.getByTestId('login-input'), 'newuser');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password123');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() =>
      expect(screen.getByTestId('error-message')).toHaveTextContent('Login already exists'),
    );
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('redirects an already signed-in visitor to home', async () => {
    localStorage.setItem('authToken', 'valid-token');
    const router = await renderRegister();

    await waitFor(() => expect(router.currentRoute.value.path).toBe('/'));
  });
});
