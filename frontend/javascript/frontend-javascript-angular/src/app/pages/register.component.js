import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonComponent } from '../components/button.component.js';
import { PanelComponent } from '../components/panel.component.js';
import { PlaqueFieldComponent } from '../components/plaque-field.component.js';
import { useI18n } from '../i18n/index.js';
import {
  getToken,
  register,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from '../lib/auth.js';
import { registerMessages } from '../lib/messages.js';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ButtonComponent, PanelComponent, PlaqueFieldComponent, RouterLink],
  template: `
    <main class="auth-page">
      <app-panel
        [title]="copy().register.title"
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
              [label]="copy().register.loginLabel"
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
              [label]="copy().register.passwordLabel"
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
              [label]="copy().register.confirmLabel"
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
            {{ errorText() }}
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
              {{ copy().register.submit }}
            </button>
          </div>
        </form>

        <p class="auth-footer-link">
          {{ copy().register.haveAccount }}
          <a routerLink="/login" data-testid="login-link">{{ copy().register.loginLink }}</a>
        </p>
      </app-panel>
    </main>
  `,
})
export class RegisterComponent {
  router = inject(Router);
  i18n = useI18n();
  copy = this.i18n.copy;
  username = signal('');
  password = signal('');
  confirmPassword = signal('');
  error = signal({ type: 'none' });
  submitting = signal(false);
  errorText = computed(() => {
    const error = this.error();
    const messages = registerMessages(this.i18n.lang());
    if (error.type === 'validation') {
      return validateCredentials(this.username().trim(), this.password().trim(), messages) ?? '';
    }
    if (error.type === 'mismatch') {
      return messages.errorPasswordMismatch;
    }
    if (error.type === 'network') {
      return messages.errorNetwork;
    }
    if (error.type === 'api') {
      return error.message;
    }
    return '';
  });

  ngOnInit() {
    if (getToken()) {
      void this.router.navigate(['/'], { replaceUrl: true });
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    this.error.set({ type: 'none' });

    const trimmedLogin = this.username().trim();
    const trimmedPassword = this.password().trim();
    const trimmedConfirm = this.confirmPassword().trim();
    const messages = registerMessages(this.i18n.lang());

    const validationError = validateCredentials(trimmedLogin, trimmedPassword, messages);
    if (validationError) {
      this.error.set({ type: 'validation' });
      return;
    }
    if (trimmedPassword !== trimmedConfirm) {
      this.error.set({ type: 'mismatch' });
      return;
    }

    this.submitting.set(true);
    try {
      const response = await register(trimmedLogin, trimmedPassword);
      saveSession(response.token);
      await this.router.navigateByUrl(response.redirectUrl || '/');
    } catch (err) {
      if (err?.network) {
        this.error.set({ type: 'network' });
      } else {
        this.error.set({
          type: 'api',
          message: resolveAuthErrorMessage(
            err,
            messages,
            messages.errorRegistrationFailed ?? '',
          ),
        });
      }
    } finally {
      this.submitting.set(false);
    }
  }
}
