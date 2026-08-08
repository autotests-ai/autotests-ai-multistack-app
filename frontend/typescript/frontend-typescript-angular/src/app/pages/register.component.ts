import { Component, inject, signal, type OnInit, type WritableSignal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PanelComponent } from '../components/panel.component';
import {
  getToken,
  register,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from '../lib/auth';
import { REGISTER_MESSAGES } from '../lib/messages';

@Component({
  selector: 'app-register-page',
  imports: [PanelComponent, RouterLink],
  template: `
    <main class="auth-page">
      <div
        appPanel
        class="auth-panel"
        [panelTitle]="'Register'"
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
              <span class="plaque-field__text">Login</span>
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
              <span class="plaque-field__text">Password</span>
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
              <span class="plaque-field__text">Confirm</span>
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
            {{ error() }}
          </p>

          <div class="auth-form__actions">
            <button
              id="submit-button"
              type="submit"
              class="btn btn--primary btn--block"
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
      </div>
    </main>
  `,
})
export class RegisterPageComponent implements OnInit {
  private readonly router = inject(Router);

  readonly username = signal('');
  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly error = signal('');
  readonly submitting = signal(false);

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
