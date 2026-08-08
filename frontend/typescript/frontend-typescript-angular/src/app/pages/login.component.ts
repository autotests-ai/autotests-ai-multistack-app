import { Component, inject, signal, type OnInit, type WritableSignal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PanelComponent } from '../components/panel.component';
import {
  getToken,
  login,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from '../lib/auth';
import { LOGIN_MESSAGES } from '../lib/messages';

@Component({
  selector: 'app-login-page',
  imports: [PanelComponent, RouterLink],
  template: `
    <main class="auth-page">
      <div
        appPanel
        class="auth-panel"
        [panelTitle]="'Login Form'"
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
                autocomplete="current-password"
                data-testid="password-input"
                [value]="password()"
                (input)="update(password, $event)"
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
              Login
            </button>
          </div>
        </form>

        <p class="auth-footer-link">
          No account?
          <a routerLink="/register" data-testid="register-link">Register</a>
        </p>
      </div>
    </main>
  `,
})
export class LoginPageComponent implements OnInit {
  private readonly router = inject(Router);

  readonly username = signal('');
  readonly password = signal('');
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
