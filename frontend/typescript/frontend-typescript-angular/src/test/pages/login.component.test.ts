import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LoginPageComponent } from '../../app/pages/login.component';

@Component({ template: '' })
class BlankComponent {}

async function renderLogin() {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', component: BlankComponent },
        { path: 'login', component: LoginPageComponent },
        { path: 'register', component: BlankComponent },
      ]),
    ],
  });
  const harness = await RouterTestingHarness.create('/login');
  harness.fixture.autoDetectChanges();
  return harness;
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('mounts the login form with canonical title and controls', async () => {
    await renderLogin();

    expect(screen.getByTestId('login-panel')).toBeInTheDocument();
    expect(screen.getByTestId('login-form-title')).toHaveTextContent('Login Form');
    expect(screen.getByTestId('login-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-input')).toHaveAttribute('name', 'username');
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toHaveAttribute('name', 'password');
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Login');
    expect(screen.getByTestId('register-link')).toBeInTheDocument();
  });

  it('shows the exact login-required error when username is empty', async () => {
    const user = userEvent.setup();
    await renderLogin();

    await user.type(screen.getByTestId('password-input'), 'password1');
    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Login is required (minimum 3 characters)',
    );
  });

  it('shows the exact password-required error when password is empty', async () => {
    const user = userEvent.setup();
    await renderLogin();

    await user.type(screen.getByTestId('login-input'), 'user1');
    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Password is required (minimum 6 characters)',
    );
  });
});
