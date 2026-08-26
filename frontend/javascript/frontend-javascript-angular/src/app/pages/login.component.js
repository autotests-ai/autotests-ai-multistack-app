import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonComponent } from '../components/button.component.js';
import { PanelComponent } from '../components/panel.component.js';
import { PlaqueFieldComponent } from '../components/plaque-field.component.js';
import { useI18n } from '../i18n/index.js';
import {
  getToken,
  login,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from '../lib/auth.js';
import { loginMessages } from '../lib/messages.js';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ButtonComponent, PanelComponent, PlaqueFieldComponent, RouterLink],
  template: `
    <main class="auth-page">
      <app-panel
        [title]="copy().login.title"
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
              [label]="copy().login.loginLabel"
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
              [label]="copy().login.passwordLabel"
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
              {{ copy().login.submit }}
            </button>
          </div>
        </form>

        <p class="auth-footer-link">
          {{ copy().login.noAccount }}
          <a routerLink="/register" data-testid="register-link">{{ copy().login.registerLink }}</a>
        </p>
      </app-panel>
    </main>
  `,
})
export class LoginComponent {
  router = inject(Router);
  i18n = useI18n();
  copy = this.i18n.copy;
  username = signal('');
  password = signal('');
  error = signal({ type: 'none' });
  submitting = signal(false);
  errorText = computed(() => {
    const error = this.error();
    const messages = loginMessages(this.i18n.lang());
    if (error.type === 'validation') {
      return validateCredentials(this.username().trim(), this.password().trim(), messages) ?? '';
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
    const messages = loginMessages(this.i18n.lang());
    const validationError = validateCredentials(trimmedLogin, trimmedPassword, messages);
    if (validationError) {
      this.error.set({ type: 'validation' });
      return;
    }

    this.submitting.set(true);
    try {
      const response = await login(trimmedLogin, trimmedPassword);
      saveSession(response.token);
      await this.router.navigateByUrl(response.redirectUrl || '/');
    } catch (err) {
      if (err?.network) {
        this.error.set({ type: 'network' });
      } else {
        this.error.set({
          type: 'api',
          message: resolveAuthErrorMessage(err, messages, messages.errorWrongCredentials ?? ''),
        });
      }
    } finally {
      this.submitting.set(false);
    }
  }
}
