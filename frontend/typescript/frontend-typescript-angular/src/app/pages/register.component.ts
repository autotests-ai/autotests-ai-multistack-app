import { Component, computed, inject, signal, type OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { I18nService } from '../../i18n';
import { ButtonComponent } from '../components/button.component';
import { PanelComponent } from '../components/panel.component';
import { PlaqueFieldComponent } from '../components/plaque-field.component';
import {
  getToken,
  register,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from '../lib/auth';
import { registerMessages } from '../lib/messages';

type RegisterError =
  | { type: 'none' }
  | { type: 'validation' }
  | { type: 'mismatch' }
  | { type: 'network' }
  | { type: 'api'; message: string };

function registerErrorText(
  error: RegisterError,
  username: string,
  password: string,
  messages: ReturnType<typeof registerMessages>,
): string {
  if (error.type === 'validation') {
    return validateCredentials(username.trim(), password.trim(), messages) ?? '';
  }
  if (error.type === 'mismatch') {
    return messages.errorPasswordMismatch ?? '';
  }
  if (error.type === 'network') {
    return messages.errorNetwork;
  }
  if (error.type === 'api') {
    return error.message;
  }
  return '';
}

@Component({
  selector: 'app-register-page',
  imports: [ButtonComponent, PanelComponent, PlaqueFieldComponent, RouterLink],
  providers: [I18nService],
  template: `
    <main class="auth-page">
      <div
        appPanel
        class="auth-panel"
        [panelTitle]="copy().register.title"
        [titleTestId]="'register-form-title'"
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
      </div>
    </main>
  `,
})
export class RegisterPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly copy = this.i18n.copy;
  readonly username = signal('');
  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly error = signal<RegisterError>({ type: 'none' });
  readonly submitting = signal(false);
  readonly errorText = computed(() =>
    registerErrorText(
      this.error(),
      this.username(),
      this.password(),
      registerMessages(this.i18n.lang()),
    ),
  );

  ngOnInit(): void {
    if (getToken()) {
      void this.router.navigate(['/'], { replaceUrl: true });
    }
  }

  async handleSubmit(event: Event): Promise<void> {
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
      if ((err as { network?: boolean } | undefined)?.network) {
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
