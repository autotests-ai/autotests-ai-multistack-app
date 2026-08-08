import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RegisterPageComponent } from '../../app/pages/register.component';

@Component({ template: '' })
class BlankComponent {}

async function renderRegister() {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', component: BlankComponent },
        { path: 'login', component: BlankComponent },
        { path: 'register', component: RegisterPageComponent },
      ]),
    ],
  });
  const harness = await RouterTestingHarness.create('/register');
  harness.fixture.autoDetectChanges();
  return harness;
}

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
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
});
