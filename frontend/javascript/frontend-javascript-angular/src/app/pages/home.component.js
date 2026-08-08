import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../components/button.component.js';
import { PanelComponent } from '../components/panel.component.js';
import { fetchHealth, fetchItems } from '../lib/api.js';
import { UI_MOUNT } from '../lib/app-base.js';
import { clearSession, deleteAccount, fetchProfile, getToken, logout } from '../lib/auth.js';
import { DELETE_ACCOUNT_CONFIRM } from '../lib/messages.js';

/**
 * State lives in signals, not plain fields — see README, "Signals, not zone.js".
 * They are the direct analogue of `useState` in the React module and `ref()` in the
 * Vue one, and they are what notifies change detection when a `fetch` settles.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ButtonComponent, PanelComponent],
  template: `
    <main
      class="page-shell page-shell--below-header grid reference-app"
      data-testid="reference-layout"
    >
      <app-panel [title]="'Reference App'">
        <p class="text text--muted">
          JavaScript Angular SPA — items loaded from <code>/api/items</code>.
        </p>
      </app-panel>

      <app-panel
        [title]="'Session'"
        [bodyClassName]="'reference-app__welcome-body'"
        [hidden]="welcome() === null"
        data-testid="welcome-panel"
      >
        <p id="welcome-message" class="text" data-testid="welcome-message">{{ welcome() }}</p>
        <button
          app-button
          id="logout-button"
          type="button"
          [variant]="'primary'"
          data-testid="logout-button"
          (click)="handleLogout()"
        >
          Logout
        </button>
        <button
          app-button
          id="delete-account-button"
          type="button"
          [variant]="'danger'"
          data-testid="delete-account-button"
          (click)="handleDeleteAccount()"
        >
          Delete account
        </button>
      </app-panel>

      <app-panel [title]="'Health'" data-testid="health-panel">
        <p
          class="text text--sm text--muted"
          [class.reference-app__error]="health().error"
          data-testid="health-status"
        >
          {{ health().text }}
        </p>
      </app-panel>

      <div class="grid" data-testid="items-list" aria-live="polite">
        @let state = items();
        @if (state.status === 'loading') {
          <app-panel [title]="'Items'">
            <p class="text text--muted">→ Loading items…</p>
          </app-panel>
        } @else if (state.status === 'empty') {
          <app-panel [title]="'Items'">
            <p class="text text--muted">No items found.</p>
          </app-panel>
        } @else if (state.status === 'error') {
          <app-panel [title]="'Items'">
            <p class="reference-app__error">✗ items: {{ state.message }}</p>
          </app-panel>
        } @else {
          @for (item of state.items; track item.id) {
            <app-panel [title]="item.name" data-testid="item-row">
              <p class="text text--muted">{{ item.description }}</p>
            </app-panel>
          }
        }
      </div>
    </main>
  `,
})
export class HomeComponent {
  router = inject(Router);
  health = signal({ text: '→ Checking health…', error: false });
  items = signal({ status: 'loading' });
  welcome = signal(null);

  active = true;

  ngOnInit() {
    this.active = true;

    fetchHealth()
      .then((payload) => {
        if (this.active) {
          this.health.set({
            text: `→ ${payload.status} | service: ${payload.service} | frontend: ${UI_MOUNT}`,
            error: false,
          });
        }
      })
      .catch((error) => {
        if (this.active) {
          this.health.set({ text: `✗ health: ${error.message}`, error: true });
        }
      });

    fetchItems()
      .then((payload) => {
        if (!this.active) return;
        const list = payload.items ?? [];
        this.items.set(list.length ? { status: 'loaded', items: list } : { status: 'empty' });
      })
      .catch((error) => {
        if (this.active) {
          this.items.set({ status: 'error', message: error.message });
        }
      });

    if (getToken()) {
      fetchProfile()
        .then((profile) => {
          if (this.active) {
            this.welcome.set(`Welcome, ${profile.username}!`);
          }
        })
        .catch(() => {
          if (this.active) {
            clearSession();
          }
        });
    }
  }

  ngOnDestroy() {
    this.active = false;
  }

  async handleLogout() {
    await logout();
    await this.router.navigate(['/login']);
  }

  async handleDeleteAccount() {
    if (!window.confirm(DELETE_ACCOUNT_CONFIRM)) {
      return;
    }
    await deleteAccount();
    await this.router.navigate(['/login']);
  }
}
