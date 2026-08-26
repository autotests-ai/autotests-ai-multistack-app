import { fetchHealth, fetchItems, type Item } from './api';
import { appPath, UI_MOUNT } from './appBase';
import { clearSession, deleteAccount, fetchProfile, formatMessage, getToken, logout } from './auth';
import { mountHeader } from './header';
import { dictionaries, readStoredLang, startI18n, type Dictionary } from './i18n';

const healthStatus = document.querySelector<HTMLElement>('[data-testid="health-status"]');
const itemsList = document.querySelector<HTMLElement>('[data-testid="items-list"]');
const welcomeMessage = document.querySelector<HTMLElement>('[data-testid="welcome-message"]');
const welcomePanel = document.querySelector<HTMLElement>('[data-testid="welcome-panel"]');
const logoutButton = document.getElementById('logout-button');
const deleteAccountButton = document.getElementById('delete-account-button');
const homeBlurb = document.getElementById('home-blurb');

type HealthState =
  | { status: 'checking' }
  | { status: 'ok'; health: string; service: string }
  | { status: 'error'; message: string };

type ItemsState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'loaded'; items: Item[] }
  | { status: 'error'; message: string };

let healthState: HealthState = { status: 'checking' };
let itemsState: ItemsState = { status: 'loading' };
let welcomeName: string | null = null;

function currentCopy(): Dictionary {
  return dictionaries[readStoredLang()];
}

function renderBlurb(template: string): void {
  if (!homeBlurb) {
    return;
  }
  const parts = String(template).split('{api}');
  const code = document.createElement('code');
  code.textContent = '/api/items';
  homeBlurb.replaceChildren(
    document.createTextNode(parts[0] || ''),
    code,
    document.createTextNode(parts[1] || ''),
  );
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

function renderItems(copy: Dictionary): void {
  if (!itemsList) {
    return;
  }
  if (itemsState.status === 'loading') {
    itemsList.innerHTML = renderContentPanel(
      copy.home.items,
      `<p class="text text--muted">${copy.home.itemsLoading}</p>`,
    );
    return;
  }
  if (itemsState.status === 'empty') {
    itemsList.innerHTML = renderContentPanel(
      copy.home.items,
      `<p class="text text--muted">${copy.home.itemsEmpty}</p>`,
    );
    return;
  }
  if (itemsState.status === 'error') {
    itemsList.innerHTML = renderContentPanel(
      copy.home.items,
      `<p class="multistack__error">${formatMessage(copy.home.itemsError, {
        message: itemsState.message,
      })}</p>`,
    );
    return;
  }

  itemsList.innerHTML = itemsState.items
    .map((item) =>
      renderContentPanel(
        item.name,
        `<p class="text text--muted">${item.description}</p>`,
        'item-row',
      ),
    )
    .join('');
}

function renderHealth(copy: Dictionary): void {
  if (!healthStatus) {
    return;
  }
  if (healthState.status === 'checking') {
    healthStatus.textContent = copy.home.healthChecking;
    healthStatus.classList.remove('multistack__error');
    return;
  }
  if (healthState.status === 'ok') {
    healthStatus.textContent = formatMessage(copy.home.healthOk, {
      status: healthState.health,
      service: healthState.service,
      frontend: UI_MOUNT,
    });
    healthStatus.classList.remove('multistack__error');
    return;
  }
  healthStatus.textContent = formatMessage(copy.home.healthError, {
    message: healthState.message,
  });
  healthStatus.classList.add('multistack__error');
}

function renderSession(copy: Dictionary): void {
  if (!welcomeMessage || !welcomePanel) {
    return;
  }
  if (welcomeName === null) {
    welcomePanel.hidden = true;
    welcomeMessage.textContent = '';
    return;
  }
  welcomeMessage.textContent = formatMessage(copy.home.welcome, { username: welcomeName });
  welcomePanel.hidden = false;
}

function applyHomeCopy(copy: Dictionary): void {
  renderBlurb(copy.home.blurb);
  renderHealth(copy);
  renderItems(copy);
  renderSession(copy);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function loadHealth(): Promise<void> {
  try {
    const payload = await fetchHealth();
    healthState = { status: 'ok', health: payload.status, service: payload.service };
  } catch (error) {
    healthState = { status: 'error', message: errorMessage(error) };
  }
  renderHealth(currentCopy());
}

async function loadItems(): Promise<void> {
  try {
    const payload = await fetchItems();
    const list = payload.items ?? [];
    itemsState = list.length ? { status: 'loaded', items: list } : { status: 'empty' };
  } catch (error) {
    itemsState = { status: 'error', message: errorMessage(error) };
  }
  renderItems(currentCopy());
}

async function loadSession(): Promise<void> {
  if (!getToken()) {
    return;
  }

  try {
    const profile = await fetchProfile();
    welcomeName = profile.username;
  } catch {
    clearSession();
    welcomeName = null;
  }
  renderSession(currentCopy());
}

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    await logout();
    window.location.href = appPath('/login');
  });
}

if (deleteAccountButton) {
  deleteAccountButton.addEventListener('click', async () => {
    if (!window.confirm(currentCopy().home.deleteConfirm)) {
      return;
    }
    await deleteAccount();
    window.location.href = appPath('/login');
  });
}

mountHeader('/');
startI18n(applyHomeCopy);
loadHealth();
loadItems();
loadSession();
