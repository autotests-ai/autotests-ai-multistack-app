import {
  Component,
  computed,
  inject,
  signal,
  type OnInit,
  type WritableSignal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { I18nService } from '../../i18n';
import { PanelComponent } from '../components/panel.component';
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
  imports: [PanelComponent, RouterLink],
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
            <label class="plaque-field plaque-field--divided plaque-field--stretch">
              <span class="plaque-field__text">{{ copy().register.loginLabel }}</span>
              <span class="plaque-divider" aria-hidden="true"></span>
              <input
                id="login-input"
                name="username"
                class="input plaque-field__control"
                type="text"
                autocomplete="username"
                data-testid="login-input"
                [value]="username()"
                (input)="update(username, $event)"
              />
            </label>
            <label class="plaque-field plaque-field--divided plaque-field--stretch">
              <span class="plaque-field__text">{{ copy().register.passwordLabel }}</span>
              <span class="plaque-divider" aria-hidden="true"></span>
              <input
                id="password-input"
                name="password"
                class="input plaque-field__control"
                type="password"
                autocomplete="new-password"
                data-testid="password-input"
                [value]="password()"
                (input)="update(password, $event)"
              />
            </label>
            <label class="plaque-field plaque-field--divided plaque-field--stretch">
              <span class="plaque-field__text">{{ copy().register.confirmLabel }}</span>
              <span class="plaque-divider" aria-hidden="true"></span>
              <input
                id="confirm-password-input"
                name="confirm-password"
                class="input plaque-field__control"
                type="password"
                autocomplete="new-password"
                data-testid="confirm-password-input"
                [value]="confirmPassword()"
                (input)="update(confirmPassword, $event)"
              />
            </label>
          </div>

          <p id="error-message" class="auth-error" aria-live="polite" data-testid="error-message">
            {{ errorText() }}
          </p>

          <div class="auth-form__actions">
            <button
              id="submit-button"
              type="submit"
              class="btn btn--primary btn--block"
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

  update(target: WritableSignal<string>, event: Event): void {
    target.set((event.target as HTMLInputElement).value);
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
