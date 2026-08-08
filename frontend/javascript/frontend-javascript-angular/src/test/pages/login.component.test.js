import { provideLocationMocks } from '@angular/common/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginComponent } from '../../app/pages/login.component.js';

@Component({ selector: 'app-blank', standalone: true, template: '' })
class BlankComponent {}

let router;

function renderLogin() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: '', component: BlankComponent },
        { path: 'login', component: LoginComponent },
        { path: 'register', component: BlankComponent },
      ]),
      provideLocationMocks(),
    ],
  });
  router = TestBed.inject(Router);
  const fixture = TestBed.createComponent(LoginComponent);
  fixture.autoDetectChanges();
  return fixture;
}

describe('LoginComponent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mounts the login form with canonical title and controls', async () => {
    renderLogin();

    expect(screen.getByTestId('login-panel')).toBeInTheDocument();
    expect(screen.getByTestId('login-form-title')).toHaveTextContent('Login Form');
    expect(screen.getByTestId('login-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-input')).toHaveAttribute('name', 'username');
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toHaveAttribute('name', 'password');
    expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password');
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Login');
    expect(screen.getByTestId('register-link')).toBeInTheDocument();
  });

  it('shows the exact login-required error when username is empty', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByTestId('password-input'), 'password1');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() =>
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Login is required (minimum 3 characters)',
      ),
    );
  });

  it('shows the exact password-required error when password is empty', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByTestId('login-input'), 'user1');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() =>
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Password is required (minimum 6 characters)',
      ),
    );
  });

  it('saves the session and follows redirectUrl on a successful login', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ token: 'fresh-token', username: 'user1', redirectUrl: '/' }),
        }),
      ),
    );
    renderLogin();

    await user.type(screen.getByTestId('login-input'), 'user1');
    await user.type(screen.getByTestId('password-input'), 'password1');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => expect(localStorage.getItem('authToken')).toBe('fresh-token'));
    await waitFor(() => expect(router.url).toBe('/'));
  });

  it('shows the API message when the credentials are wrong', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ message: 'Wrong login or password' }),
        }),
      ),
    );
    renderLogin();

    await user.type(screen.getByTestId('login-input'), 'user1');
    await user.type(screen.getByTestId('password-input'), 'password1');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() =>
      expect(screen.getByTestId('error-message')).toHaveTextContent('Wrong login or password'),
    );
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('shows the network message when the request never reaches the API', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    renderLogin();

    await user.type(screen.getByTestId('login-input'), 'user1');
    await user.type(screen.getByTestId('password-input'), 'password1');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() =>
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Network error. Check your connection and try again.',
      ),
    );
  });

  it('redirects an already signed-in visitor to home', async () => {
    localStorage.setItem('authToken', 'valid-token');
    renderLogin();

    await waitFor(() => expect(router.url).toBe('/'));
  });
});
