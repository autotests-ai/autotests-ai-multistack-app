import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonComponent } from '../components/button.component.js';
import { PanelComponent } from '../components/panel.component.js';
import { PlaqueFieldComponent } from '../components/plaque-field.component.js';
import {
  getToken,
  register,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from '../lib/auth.js';
import { REGISTER_MESSAGES } from '../lib/messages.js';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ButtonComponent, PanelComponent, PlaqueFieldComponent, RouterLink],
  template: `
    <main class="auth-page">
      <app-panel
        [title]="'Register'"
        [titleTestId]="'register-form-title'"
        class="auth-panel"
        data-testid="register-panel"
      >
        <form
          id="register-form"
          class="auth-form"
          data-testid="register-form"
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
              [autocomplete]="'new-password'"
              [testId]="'password-input'"
              [value]="password()"
              (valueChange)="password.set($event)"
            ></label>
            <label
              app-plaque-field
              [label]="'Confirm'"
              [controlId]="'confirm-password-input'"
              [controlName]="'confirm-password'"
              [type]="'password'"
              [autocomplete]="'new-password'"
              [testId]="'confirm-password-input'"
              [value]="confirmPassword()"
              (valueChange)="confirmPassword.set($event)"
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
              Register
            </button>
          </div>
        </form>

        <p class="auth-footer-link">
          Already have an account?
          <a routerLink="/login" data-testid="login-link">Login</a>
        </p>
      </app-panel>
    </main>
  `,
})
export class RegisterComponent {
  router = inject(Router);
  username = signal('');
  password = signal('');
  confirmPassword = signal('');
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
    const trimmedConfirm = this.confirmPassword().trim();

    const validationError = validateCredentials(trimmedLogin, trimmedPassword, REGISTER_MESSAGES);
    if (validationError) {
      this.error.set(validationError);
      return;
    }
    if (trimmedPassword !== trimmedConfirm) {
      this.error.set(REGISTER_MESSAGES.errorPasswordMismatch ?? '');
      return;
    }

    this.submitting.set(true);
    try {
      const response = await register(trimmedLogin, trimmedPassword);
      saveSession(response.token);
      await this.router.navigateByUrl(response.redirectUrl || '/');
    } catch (err) {
      this.error.set(
        resolveAuthErrorMessage(
          err,
          REGISTER_MESSAGES,
          REGISTER_MESSAGES.errorRegistrationFailed ?? '',
        ),
      );
    } finally {
      this.submitting.set(false);
    }
  }
}
