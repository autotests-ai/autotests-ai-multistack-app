import { Component, computed, DestroyRef, inject, signal, type OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from '../../i18n';
import { PanelComponent } from '../components/panel.component';
import { fetchHealth, fetchItems, type Item } from '../lib/api';
import { UI_MOUNT } from '../lib/app-base';
import {
  clearSession,
  deleteAccount,
  fetchProfile,
  formatMessage,
  getToken,
  logout,
} from '../lib/auth';

type HealthState =
  | { status: 'checking' }
  | { status: 'ok'; service: string; health: string }
  | { status: 'error'; message: string };
type ItemsState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'loaded'; items: Item[] }
  | { status: 'error'; message: string };

@Component({
  selector: 'app-home-page',
  imports: [PanelComponent],
  providers: [I18nService],
  template: `
    <main
      class="page-shell page-shell--below-header grid multistack"
      data-testid="multistack-layout"
    >
      <div appPanel [panelTitle]="copy().home.title">
        <p class="text text--muted">
          {{ blurbBefore() }}<code>/api/items</code>{{ blurbAfter() }}
        </p>
      </div>

      <div
        appPanel
        [panelTitle]="copy().home.session"
        [bodyClassName]="'multistack__welcome-body'"
        data-testid="welcome-panel"
        [hidden]="welcomeName() === null"
      >
        <p id="welcome-message" class="text" data-testid="welcome-message">{{ welcomeText() }}</p>
        <button
          id="logout-button"
          type="button"
          class="btn btn--primary"
          data-testid="logout-button"
          (click)="handleLogout()"
        >
          {{ copy().home.logout }}
        </button>
        <button
          id="delete-account-button"
          type="button"
          class="btn btn--danger"
          data-testid="delete-account-button"
          (click)="handleDeleteAccount()"
        >
          {{ copy().home.deleteAccount }}
        </button>
      </div>

      <div appPanel [panelTitle]="copy().home.health" data-testid="health-panel">
        <p
          [class]="
            health().status === 'error'
              ? 'text text--sm text--muted multistack__error'
              : 'text text--sm text--muted'
          "
          data-testid="health-status"
        >
          {{ healthText() }}
        </p>
      </div>

      <div class="grid" data-testid="items-list" aria-live="polite">
        @switch (items().status) {
          @case ('loading') {
            <div appPanel [panelTitle]="copy().home.items">
              <p class="text text--muted">{{ copy().home.itemsLoading }}</p>
            </div>
          }
          @case ('empty') {
            <div appPanel [panelTitle]="copy().home.items">
              <p class="text text--muted">{{ copy().home.itemsEmpty }}</p>
            </div>
          }
          @case ('error') {
            <div appPanel [panelTitle]="copy().home.items">
              <p class="multistack__error">
                {{ itemsErrorText() }}
              </p>
            </div>
          }
          @default {
            @for (item of loadedItems(); track item.id) {
              <div appPanel [panelTitle]="item.name" data-testid="item-row">
                <p class="text text--muted">{{ item.description }}</p>
              </div>
            }
          }
        }
      </div>
    </main>
  `,
})
export class HomePageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly copy = this.i18n.copy;
  readonly health = signal<HealthState>({ status: 'checking' });
  readonly items = signal<ItemsState>({ status: 'loading' });
  readonly welcomeName = signal<string | null>(null);

  readonly blurbBefore = computed(() => this.copy().home.blurb.split('{api}')[0] ?? '');
  readonly blurbAfter = computed(() => this.copy().home.blurb.split('{api}')[1] ?? '');
  readonly welcomeText = computed(() => {
    const name = this.welcomeName();
    return name === null ? '' : formatMessage(this.copy().home.welcome, { username: name });
  });
  readonly healthText = computed(() => {
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
  readonly itemsErrorText = computed(() => {
    const items = this.items();
    return items.status === 'error'
      ? formatMessage(this.copy().home.itemsError, { message: items.message })
      : '';
  });
  readonly loadedItems = computed(() => {
    const items = this.items();
    return items.status === 'loaded' ? items.items : [];
  });

  /** Guards the in-flight responses against a route change (mirrors the other modules). */
  private active = true;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.active = false;
    });
  }

  ngOnInit(): void {
    fetchHealth()
      .then((payload) => {
        if (this.active) {
          this.health.set({ status: 'ok', health: payload.status, service: payload.service });
        }
      })
      .catch((error: Error) => {
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
      .catch((error: Error) => {
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

  async handleLogout(): Promise<void> {
    await logout();
    await this.router.navigate(['/login']);
  }

  async handleDeleteAccount(): Promise<void> {
    if (!window.confirm(this.copy().home.deleteConfirm)) {
      return;
    }
    await deleteAccount();
    await this.router.navigate(['/login']);
  }
}
