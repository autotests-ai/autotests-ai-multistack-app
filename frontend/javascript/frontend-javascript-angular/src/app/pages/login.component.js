import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonComponent } from '../components/button.component.js';
import { PanelComponent } from '../components/panel.component.js';
import { PlaqueFieldComponent } from '../components/plaque-field.component.js';
import {
  getToken,
  login,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from '../lib/auth.js';
import { LOGIN_MESSAGES } from '../lib/messages.js';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ButtonComponent, PanelComponent, PlaqueFieldComponent, RouterLink],
  template: `
    <main class="auth-page">
      <app-panel
        [title]="'Login Form'"
        [titleTestId]="'login-form-title'"
        class="auth-panel"
        data-testid="login-panel"
      >
        <form
          id="login-form"
          class="auth-form"
          data-testid="login-form"
          (submit)="handleSubmit($event)"
        >
          <div class="plaque-field-list">
            <label
              app-plaque-field
              [label]="'Login'"
              [controlId]="'login-input'"
              [controlName]="'username'"
              [type]="'text'"
              [autocomplete]="'username'"
              [testId]="'login-input'"
              [value]="username()"
              (valueChange)="username.set($event)"
            ></label>
            <label
              app-plaque-field
              [label]="'Password'"
              [controlId]="'password-input'"
              [controlName]="'password'"
              [type]="'password'"
              [autocomplete]="'current-password'"
              [testId]="'password-input'"
              [value]="password()"
              (valueChange)="password.set($event)"
            ></label>
          </div>

          <p id="error-message" class="auth-error" aria-live="polite" data-testid="error-message">
            {{ error() }}
          </p>

          <div class="auth-form__actions">
            <button
              app-button
              id="submit-button"
              type="submit"
              class="btn--block"
              [variant]="'primary'"
              data-testid="submit-button"
              [disabled]="submitting()"
            >
              Login
            </button>
          </div>
        </form>

        <p class="auth-footer-link">
          No account?
          <a routerLink="/register" data-testid="register-link">Register</a>
        </p>
      </app-panel>
    </main>
  `,
})
export class LoginComponent {
  router = inject(Router);
  username = signal('');
  password = signal('');
  error = signal('');
  submitting = signal(false);

  ngOnInit() {
    if (getToken()) {
      void this.router.navigate(['/'], { replaceUrl: true });
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    this.error.set('');

    const trimmedLogin = this.username().trim();
    const trimmedPassword = this.password().trim();
    const validationError = validateCredentials(trimmedLogin, trimmedPassword, LOGIN_MESSAGES);
    if (validationError) {
      this.error.set(validationError);
      return;
    }

    this.submitting.set(true);
    try {
      const response = await login(trimmedLogin, trimmedPassword);
      saveSession(response.token);
      await this.router.navigateByUrl(response.redirectUrl || '/');
    } catch (err) {
      this.error.set(
        resolveAuthErrorMessage(err, LOGIN_MESSAGES, LOGIN_MESSAGES.errorWrongCredentials ?? ''),
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
