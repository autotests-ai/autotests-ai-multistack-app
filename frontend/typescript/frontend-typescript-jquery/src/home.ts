import $ from 'jquery';
import { apiUrl, appPath, UI_MOUNT } from './appBase';
import { clearSession, deleteAccount, fetchProfile, formatMessage, getToken, logout } from './auth';
import { mountHeader } from './headerConfig';
import {
  dictionaries,
  readStoredLang,
  startI18n,
  type Dictionary,
  type Lang,
} from './i18n';
import './styles';

interface HealthResponse {
  status: string;
  service: string;
}

interface Item {
  id: number;
  name: string;
  description: string;
}

interface ItemsResponse {
  items?: Item[];
}

type HealthState =
  | { status: 'checking' }
  | { status: 'ok'; health: string; service: string }
  | { status: 'error'; message: string };

type ItemsState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'loaded'; items: Item[] }
  | { status: 'error'; message: string };

/** Panel chrome is static markup; every dynamic string goes in through `.text()`. */
const PANEL_CHROME = `
  <div class="panel__bar">
    <div class="panel__dots" aria-hidden="true">
      <span class="panel__dot"></span>
      <span class="panel__dot"></span>
      <span class="panel__dot"></span>
    </div>
    <div class="panel__trail">
      <span class="panel__title"></span>
    </div>
  </div>
  <div class="panel__body"></div>`;

function paragraph(className: string, text: string): JQuery<HTMLElement> {
  return $('<p></p>').addClass(className).text(text);
}

function contentPanel(
  title: string,
  $body: JQuery<HTMLElement>,
  testId?: string,
): JQuery<HTMLElement> {
  const $panel = $('<div class="panel panel--content"></div>').html(PANEL_CHROME);
  $panel.find('.panel__title').text(title);
  $panel.find('.panel__body').append($body);
  if (testId) {
    $panel.attr('data-testid', testId);
  }
  return $panel;
}

$(() => {
  mountHeader('home');

  let lang: Lang = readStoredLang();
  let healthState: HealthState = { status: 'checking' };
  let itemsState: ItemsState = { status: 'loading' };
  let welcomeName: string | null = null;

  const $healthStatus = $('[data-testid="health-status"]');
  const $itemsList = $('[data-testid="items-list"]');
  const $welcomePanel = $('[data-testid="welcome-panel"]');
  const $welcomeMessage = $('[data-testid="welcome-message"]');
  const $homeBlurb = $('#home-blurb');

  function currentCopy(): Dictionary {
    return dictionaries[lang];
  }

  function renderBlurb(template: string): void {
    if (!$homeBlurb.length) {
      return;
    }
    const parts = String(template).split('{api}');
    const $code = $('<code></code>').text('/api/items');
    $homeBlurb.empty().append(
      document.createTextNode(parts[0] || ''),
      $code,
      document.createTextNode(parts[1] || ''),
    );
  }

  function renderItems(copy: Dictionary): void {
    if (itemsState.status === 'loading') {
      $itemsList
        .empty()
        .append(contentPanel(copy.home.items, paragraph('text text--muted', copy.home.itemsLoading)));
      return;
    }
    if (itemsState.status === 'empty') {
      $itemsList
        .empty()
        .append(contentPanel(copy.home.items, paragraph('text text--muted', copy.home.itemsEmpty)));
      return;
    }
    if (itemsState.status === 'error') {
      $itemsList.empty().append(
        contentPanel(
          copy.home.items,
          paragraph(
            'multistack__error',
            formatMessage(copy.home.itemsError, { message: itemsState.message }),
          ),
        ),
      );
      return;
    }

    $itemsList.empty();
    for (const item of itemsState.items) {
      $itemsList.append(
        contentPanel(item.name, paragraph('text text--muted', item.description), 'item-row'),
      );
    }
  }

  function renderHealth(copy: Dictionary): void {
    if (healthState.status === 'checking') {
      $healthStatus.text(copy.home.healthChecking).removeClass('multistack__error');
      return;
    }
    if (healthState.status === 'ok') {
      $healthStatus
        .text(
          formatMessage(copy.home.healthOk, {
            status: healthState.health,
            service: healthState.service,
            frontend: UI_MOUNT,
          }),
        )
        .removeClass('multistack__error');
      return;
    }
    $healthStatus
      .text(formatMessage(copy.home.healthError, { message: healthState.message }))
      .addClass('multistack__error');
  }

  function renderSession(copy: Dictionary): void {
    if (welcomeName === null) {
      $welcomePanel.prop('hidden', true);
      $welcomeMessage.text('');
      return;
    }
    $welcomeMessage.text(formatMessage(copy.home.welcome, { username: welcomeName }));
    $welcomePanel.prop('hidden', false);
  }

  function applyHomeCopy(copy: Dictionary, next: Lang): void {
    lang = next;
    renderBlurb(copy.home.blurb);
    renderHealth(copy);
    renderItems(copy);
    renderSession(copy);
  }

  $('[data-testid="logout-button"]').on('click', async () => {
    await logout();
    window.location.href = appPath('/login');
  });

  // Deletes the account — not a logout. Cancel keeps the session untouched.
  $('[data-testid="delete-account-button"]').on('click', async () => {
    if (!window.confirm(currentCopy().home.deleteConfirm)) {
      return;
    }
    await deleteAccount();
    window.location.href = appPath('/login');
  });

  startI18n(applyHomeCopy);

  async function loadHealth(): Promise<void> {
    try {
      const response = await fetch(apiUrl('/health'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as HealthResponse;
      healthState = { status: 'ok', health: payload.status, service: payload.service };
    } catch (error) {
      healthState = { status: 'error', message: (error as Error).message };
    }
    renderHealth(currentCopy());
  }

  async function loadItems(): Promise<void> {
    try {
      const response = await fetch(apiUrl('/items'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as ItemsResponse;
      const list = payload.items ?? [];
      itemsState = list.length ? { status: 'loaded', items: list } : { status: 'empty' };
    } catch (error) {
      itemsState = { status: 'error', message: (error as Error).message };
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

  void loadHealth();
  void loadItems();
  void loadSession();
});
