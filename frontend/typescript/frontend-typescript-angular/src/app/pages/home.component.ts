import { Component, DestroyRef, inject, signal, type OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PanelComponent } from '../components/panel.component';
import { fetchHealth, fetchItems, type Item } from '../lib/api';
import { UI_MOUNT } from '../lib/app-base';
import { clearSession, deleteAccount, fetchProfile, getToken, logout } from '../lib/auth';
import { DELETE_ACCOUNT_CONFIRM } from '../lib/messages';

type ItemsStatus = 'loading' | 'empty' | 'loaded' | 'error';

@Component({
  selector: 'app-home-page',
  imports: [PanelComponent],
  template: `
    <main
      class="page-shell page-shell--below-header grid reference-app"
      data-testid="reference-layout"
    >
      <div appPanel [panelTitle]="'Reference App'">
        <p class="text text--muted">
          TypeScript Angular SPA — items loaded from <code>/api/items</code>.
        </p>
      </div>

      <div
        appPanel
        [panelTitle]="'Session'"
        [bodyClassName]="'reference-app__welcome-body'"
        data-testid="welcome-panel"
        [hidden]="welcome() === null"
      >
        <p id="welcome-message" class="text" data-testid="welcome-message">{{ welcome() }}</p>
        <button
          id="logout-button"
          type="button"
          class="btn btn--primary"
          data-testid="logout-button"
          (click)="handleLogout()"
        >
          Logout
        </button>
        <button
          id="delete-account-button"
          type="button"
          class="btn btn--danger"
          data-testid="delete-account-button"
          (click)="handleDeleteAccount()"
        >
          Delete account
        </button>
      </div>

      <div appPanel [panelTitle]="'Health'" data-testid="health-panel">
        <p
          [class]="
            healthError()
              ? 'text text--sm text--muted reference-app__error'
              : 'text text--sm text--muted'
          "
          data-testid="health-status"
        >
          {{ healthText() }}
        </p>
      </div>

      <div class="grid" data-testid="items-list" aria-live="polite">
        @switch (itemsStatus()) {
          @case ('loading') {
            <div appPanel [panelTitle]="'Items'">
              <p class="text text--muted">→ Loading items…</p>
            </div>
          }
          @case ('empty') {
            <div appPanel [panelTitle]="'Items'">
              <p class="text text--muted">No items found.</p>
            </div>
          }
          @case ('error') {
            <div appPanel [panelTitle]="'Items'">
              <p class="reference-app__error">✗ items: {{ itemsError() }}</p>
            </div>
          }
          @default {
            @for (item of items(); track item.id) {
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

  readonly healthText = signal('→ Checking health…');
  readonly healthError = signal(false);
  readonly itemsStatus = signal<ItemsStatus>('loading');
  readonly items = signal<Item[]>([]);
  readonly itemsError = signal('');
  readonly welcome = signal<string | null>(null);

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
          this.healthText.set(
            `→ ${payload.status} | service: ${payload.service} | frontend: ${UI_MOUNT}`,
          );
          this.healthError.set(false);
        }
      })
      .catch((error: Error) => {
        if (this.active) {
          this.healthText.set(`✗ health: ${error.message}`);
          this.healthError.set(true);
        }
      });

    fetchItems()
      .then((payload) => {
        if (!this.active) return;
        const list = payload.items ?? [];
        this.items.set(list);
        this.itemsStatus.set(list.length ? 'loaded' : 'empty');
      })
      .catch((error: Error) => {
        if (this.active) {
          this.itemsError.set(error.message);
          this.itemsStatus.set('error');
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

  async handleLogout(): Promise<void> {
    await logout();
    await this.router.navigate(['/login']);
  }

  async handleDeleteAccount(): Promise<void> {
    if (!window.confirm(DELETE_ACCOUNT_CONFIRM)) {
      return;
    }
    await deleteAccount();
    await this.router.navigate(['/login']);
  }
}
