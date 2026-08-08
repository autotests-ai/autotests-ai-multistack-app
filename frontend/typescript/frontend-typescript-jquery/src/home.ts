import $ from 'jquery';
import { apiUrl, appPath, UI_MOUNT } from './appBase';
import { clearSession, deleteAccount, fetchProfile, getToken, logout } from './auth';
import { mountHeader } from './headerConfig';
import { DELETE_ACCOUNT_CONFIRM } from './messages';
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

function renderItems($itemsList: JQuery<HTMLElement>, items: Item[]): void {
  $itemsList.empty();

  if (!items.length) {
    $itemsList.append(contentPanel('Items', paragraph('text text--muted', 'No items found.')));
    return;
  }

  for (const item of items) {
    $itemsList.append(
      contentPanel(item.name, paragraph('text text--muted', item.description), 'item-row'),
    );
  }
}

async function loadHealth($healthStatus: JQuery<HTMLElement>): Promise<void> {
  try {
    const response = await fetch(apiUrl('/health'));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = (await response.json()) as HealthResponse;
    $healthStatus.text(`→ ${payload.status} | service: ${payload.service} | frontend: ${UI_MOUNT}`);
  } catch (error) {
    $healthStatus.text(`✗ health: ${(error as Error).message}`).addClass('reference-app__error');
  }
}

async function loadItems($itemsList: JQuery<HTMLElement>): Promise<void> {
  try {
    const response = await fetch(apiUrl('/items'));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = (await response.json()) as ItemsResponse;
    renderItems($itemsList, payload.items ?? []);
  } catch (error) {
    const message = `✗ items: ${(error as Error).message}`;
    $itemsList.empty().append(contentPanel('Items', paragraph('reference-app__error', message)));
  }
}

async function loadSession(
  $welcomePanel: JQuery<HTMLElement>,
  $welcomeMessage: JQuery<HTMLElement>,
): Promise<void> {
  if (!getToken()) {
    return;
  }

  try {
    const profile = await fetchProfile();
    $welcomeMessage.text(`Welcome, ${profile.username}!`);
    $welcomePanel.prop('hidden', false);
  } catch {
    clearSession();
  }
}

$(() => {
  mountHeader('home');

  const $healthStatus = $('[data-testid="health-status"]');
  const $itemsList = $('[data-testid="items-list"]');
  const $welcomePanel = $('[data-testid="welcome-panel"]');
  const $welcomeMessage = $('[data-testid="welcome-message"]');

  $('[data-testid="logout-button"]').on('click', async () => {
    await logout();
    window.location.href = appPath('/login');
  });

  // Deletes the account — not a logout. Cancel keeps the session untouched.
  $('[data-testid="delete-account-button"]').on('click', async () => {
    if (!window.confirm(DELETE_ACCOUNT_CONFIRM)) {
      return;
    }
    await deleteAccount();
    window.location.href = appPath('/login');
  });

  void loadHealth($healthStatus);
  void loadItems($itemsList);
  void loadSession($welcomePanel, $welcomeMessage);
});
