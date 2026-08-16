import { fetchHealth, fetchItems, type Item } from './api';
import { appPath, UI_MOUNT } from './appBase';
import { clearSession, deleteAccount, fetchProfile, getToken, logout } from './auth';
import { mountHeader } from './header';
import { DELETE_ACCOUNT_CONFIRM } from './messages';

const healthStatus = document.querySelector<HTMLElement>('[data-testid="health-status"]');
const itemsList = document.querySelector<HTMLElement>('[data-testid="items-list"]');
const welcomeMessage = document.querySelector<HTMLElement>('[data-testid="welcome-message"]');
const welcomePanel = document.querySelector<HTMLElement>('[data-testid="welcome-panel"]');
const logoutButton = document.getElementById('logout-button');
const deleteAccountButton = document.getElementById('delete-account-button');

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function renderPanelBar(title: string): string {
  return `
    <div class="panel__bar">
      <div class="panel__dots" aria-hidden="true">
        <span class="panel__dot"></span>
        <span class="panel__dot"></span>
        <span class="panel__dot"></span>
      </div>
      <div class="panel__trail">
        <span class="panel__title">${title}</span>
      </div>
    </div>`;
}

function renderContentPanel(title: string, bodyHtml: string, testId?: string): string {
  const testAttr = testId ? ` data-testid="${testId}"` : '';
  return `
    <div class="panel panel--content"${testAttr}>
      ${renderPanelBar(title)}
      <div class="panel__body">
        ${bodyHtml}
      </div>
    </div>`;
}

function renderItems(target: HTMLElement, items: Item[]): void {
  if (!items.length) {
    target.innerHTML = renderContentPanel(
      'Items',
      '<p class="text text--muted">No items found.</p>',
    );
    return;
  }

  target.innerHTML = items
    .map((item) =>
      renderContentPanel(item.name, `<p class="text text--muted">${item.description}</p>`, 'item-row'),
    )
    .join('');
}

async function loadHealth(): Promise<void> {
  if (!healthStatus) {
    return;
  }
  try {
    const payload = await fetchHealth();
    healthStatus.textContent = `→ ${payload.status} | service: ${payload.service} | frontend: ${UI_MOUNT}`;
  } catch (error) {
    healthStatus.textContent = `✗ health: ${errorMessage(error)}`;
    healthStatus.classList.add('multistack__error');
  }
}

async function loadItems(): Promise<void> {
  if (!itemsList) {
    return;
  }
  try {
    const payload = await fetchItems();
    renderItems(itemsList, payload.items ?? []);
  } catch (error) {
    itemsList.innerHTML = renderContentPanel(
      'Items',
      `<p class="multistack__error">✗ items: ${errorMessage(error)}</p>`,
    );
  }
}

async function loadSession(): Promise<void> {
  if (!welcomeMessage || !welcomePanel || !getToken()) {
    return;
  }

  try {
    const profile = await fetchProfile();
    welcomeMessage.textContent = `Welcome, ${profile.username}!`;
    welcomePanel.hidden = false;
  } catch {
    clearSession();
  }
}

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    await logout();
    window.location.href = appPath('/login');
  });
}

if (deleteAccountButton) {
  deleteAccountButton.addEventListener('click', async () => {
    if (!window.confirm(DELETE_ACCOUNT_CONFIRM)) {
      return;
    }
    await deleteAccount();
    window.location.href = appPath('/login');
  });
}

mountHeader('/');
loadHealth();
loadItems();
loadSession();
