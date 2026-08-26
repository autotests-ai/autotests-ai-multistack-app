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
  login,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from '../lib/auth';
import { loginMessages } from '../lib/messages';

type LoginError =
  | { type: 'none' }
  | { type: 'validation' }
  | { type: 'network' }
  | { type: 'api'; message: string };

function loginErrorText(
  error: LoginError,
  username: string,
  password: string,
  messages: ReturnType<typeof loginMessages>,
): string {
  if (error.type === 'validation') {
    return validateCredentials(username.trim(), password.trim(), messages) ?? '';
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
  selector: 'app-login-page',
  imports: [PanelComponent, RouterLink],
  providers: [I18nService],
  template: `
    <main class="auth-page">
      <div
        appPanel
        class="auth-panel"
        [panelTitle]="copy().login.title"
        [titleTestId]="'login-form-title'"
        data-testid="login-panel"
      >
        <form
          id="login-form"
          class="auth-form"
          data-testid="login-form"
          (submit)="handleSubmit($event)"
        >
          <div class="plaque-field-list">
            <label class="plaque-field plaque-field--divided plaque-field--stretch">
              <span class="plaque-field__text">{{ copy().login.loginLabel }}</span>
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
              <span class="plaque-field__text">{{ copy().login.passwordLabel }}</span>
              <span class="plaque-divider" aria-hidden="true"></span>
              <input
                id="password-input"
                name="password"
                class="input plaque-field__control"
                type="password"
                autocomplete="current-password"
                data-testid="password-input"
                [value]="password()"
                (input)="update(password, $event)"
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
              {{ copy().login.submit }}
            </button>
          </div>
        </form>

        <p class="auth-footer-link">
          {{ copy().login.noAccount }}
          <a routerLink="/register" data-testid="register-link">{{ copy().login.registerLink }}</a>
        </p>
      </div>
    </main>
  `,
})
export class LoginPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly copy = this.i18n.copy;
  readonly username = signal('');
  readonly password = signal('');
  readonly error = signal<LoginError>({ type: 'none' });
  readonly submitting = signal(false);
  readonly errorText = computed(() =>
    loginErrorText(
      this.error(),
      this.username(),
      this.password(),
      loginMessages(this.i18n.lang()),
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
      if ((err as { network?: boolean } | undefined)?.network) {
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
