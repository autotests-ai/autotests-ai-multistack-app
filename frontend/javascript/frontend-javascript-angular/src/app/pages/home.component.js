import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../components/button.component.js';
import { PanelComponent } from '../components/panel.component.js';
import { useI18n } from '../i18n/index.js';
import { fetchHealth, fetchItems } from '../lib/api.js';
import { UI_MOUNT } from '../lib/app-base.js';
import { clearSession, deleteAccount, fetchProfile, formatMessage, getToken, logout } from '../lib/auth.js';

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
      class="page-shell page-shell--below-header grid multistack"
      data-testid="multistack-layout"
    >
      <app-panel [title]="copy().home.title">
        <p class="text text--muted">
          {{ blurbParts()[0] }}<code>/api/items</code>{{ blurbParts()[1] }}
        </p>
      </app-panel>

      <app-panel
        [title]="copy().home.session"
        [bodyClassName]="'multistack__welcome-body'"
        [hidden]="welcomeName() === null"
        data-testid="welcome-panel"
      >
        <p id="welcome-message" class="text" data-testid="welcome-message">{{ welcomeText() }}</p>
        <button
          app-button
          id="logout-button"
          type="button"
          [variant]="'primary'"
          data-testid="logout-button"
          (click)="handleLogout()"
        >
          {{ copy().home.logout }}
        </button>
        <button
          app-button
          id="delete-account-button"
          type="button"
          [variant]="'danger'"
          data-testid="delete-account-button"
          (click)="handleDeleteAccount()"
        >
          {{ copy().home.deleteAccount }}
        </button>
      </app-panel>

      <app-panel [title]="copy().home.health" data-testid="health-panel">
        <p
          class="text text--sm text--muted"
          [class.multistack__error]="health().status === 'error'"
          data-testid="health-status"
        >
          {{ healthText() }}
        </p>
      </app-panel>

      <div class="grid" data-testid="items-list" aria-live="polite">
        @let state = items();
        @if (state.status === 'loading') {
          <app-panel [title]="copy().home.items">
            <p class="text text--muted">{{ copy().home.itemsLoading }}</p>
          </app-panel>
        } @else if (state.status === 'empty') {
          <app-panel [title]="copy().home.items">
            <p class="text text--muted">{{ copy().home.itemsEmpty }}</p>
          </app-panel>
        } @else if (state.status === 'error') {
          <app-panel [title]="copy().home.items">
            <p class="multistack__error">{{ itemsErrorText(state.message) }}</p>
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
  i18n = useI18n();
  copy = this.i18n.copy;
  health = signal({ status: 'checking' });
  items = signal({ status: 'loading' });
  welcomeName = signal(null);
  blurbParts = computed(() => this.copy().home.blurb.split('{api}'));
  welcomeText = computed(() => {
    const name = this.welcomeName();
    return name === null ? '' : formatMessage(this.copy().home.welcome, { username: name });
  });
  healthText = computed(() => {
    const health = this.health();
    const home = this.copy().home;
    if (health.status === 'checking') {
      return home.healthChecking;
    }
    if (health.status === 'ok') {
      return formatMessage(home.healthOk, {
        status: health.health,
        service: health.service,
        frontend: UI_MOUNT,
      });
    }
    return formatMessage(home.healthError, { message: health.message });
  });

  active = true;

  ngOnInit() {
    this.active = true;

    fetchHealth()
      .then((payload) => {
        if (this.active) {
          this.health.set({
            status: 'ok',
            health: payload.status,
            service: payload.service,
          });
        }
      })
      .catch((error) => {
        if (this.active) {
          this.health.set({ status: 'error', message: error.message });
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
            this.welcomeName.set(profile.username);
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

  itemsErrorText(message) {
    return formatMessage(this.copy().home.itemsError, { message });
  }

  async handleLogout() {
    await logout();
    await this.router.navigate(['/login']);
  }

  async handleDeleteAccount() {
    if (!window.confirm(this.copy().home.deleteConfirm)) {
      return;
    }
    await deleteAccount();
    await this.router.navigate(['/login']);
  }
}
