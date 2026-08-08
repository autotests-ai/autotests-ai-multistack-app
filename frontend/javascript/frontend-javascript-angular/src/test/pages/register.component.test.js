import { provideLocationMocks } from '@angular/common/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterComponent } from '../../app/pages/register.component.js';

@Component({ selector: 'app-blank', standalone: true, template: '' })
class BlankComponent {}

let router;

function renderRegister() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: '', component: BlankComponent },
        { path: 'login', component: BlankComponent },
        { path: 'register', component: RegisterComponent },
      ]),
      provideLocationMocks(),
    ],
  });
  router = TestBed.inject(Router);
  const fixture = TestBed.createComponent(RegisterComponent);
  fixture.autoDetectChanges();
  return fixture;
}

describe('RegisterComponent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mounts the register form with canonical title and controls', async () => {
    renderRegister();

    expect(screen.getByTestId('register-panel')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-title')).toHaveTextContent('Register');
    expect(screen.getByTestId('login-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toHaveAttribute(
      'name',
      'confirm-password',
    );
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Register');
    expect(screen.getByTestId('login-link')).toBeInTheDocument();
  });

  it('shows the exact mismatch error when passwords differ', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByTestId('login-input'), 'newuser');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password124');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() =>
      expect(screen.getByTestId('error-message')).toHaveTextContent('Passwords do not match'),
    );
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
    renderRegister();

    await user.type(screen.getByTestId('login-input'), 'newuser');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'password123');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => expect(localStorage.getItem('authToken')).toBe('new-token'));
    await waitFor(() => expect(router.url).toBe('/'));
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
    renderRegister();

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
    renderRegister();

    await waitFor(() => expect(router.url).toBe('/'));
  });
});
