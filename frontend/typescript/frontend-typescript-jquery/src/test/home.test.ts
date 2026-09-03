import $ from 'jquery';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ru } from '../i18n';
import {
  dispatchLang,
  fetchCalls,
  jsonResponse,
  type LocationStub,
  mountDocument,
  restoreLocation,
  stubApis,
  stubLocation,
  waitForPageReady,
} from './support/harness';

let locationStub: LocationStub;

async function renderHome(): Promise<void> {
  mountDocument('index.html');
  vi.resetModules();
  await import('../home');
  await waitForPageReady();
}

function $testId(testId: string): JQuery<HTMLElement> {
  return $(`[data-testid="${testId}"]`);
}

function click(testId: string): void {
  $testId(testId).trigger('click');
}

async function waitForWelcome(): Promise<void> {
  await vi.waitFor(() => {
    expect($testId('welcome-message').text()).toBe('Welcome, user1!');
  });
}

describe('home', () => {
  beforeEach(() => {
    localStorage.clear();
    locationStub = stubLocation('/');
    stubApis();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    restoreLocation();
  });

  it('renders the reference layout with health and items from the API', async () => {
    await renderHome();

    expect($testId('multistack-layout')).toHaveLength(1);
    expect($testId('health-panel')).toHaveLength(1);

    await vi.waitFor(() => {
      expect($testId('health-status').text()).toBe(
        '→ UP | service: backend-java-spring | frontend: frontend-typescript-jquery',
      );
    });

    await vi.waitFor(() => {
      expect($testId('item-row')).toHaveLength(1);
    });
    expect($testId('item-row').find('.panel__title').text()).toBe('Alpha');
    expect($testId('item-row').find('.panel__body').text().trim()).toBe('First item');
  });

  it('renders the empty state when the API returns no items', async () => {
    stubApis((url) => (url.includes('/api/items') ? jsonResponse({ items: [] }) : null));

    await renderHome();

    await vi.waitFor(() => {
      expect($testId('items-list').text()).toContain('No items found.');
    });
    expect($testId('item-row')).toHaveLength(0);
  });

  it('renders the items error copy when the request fails', async () => {
    stubApis((url) =>
      url.includes('/api/items') ? jsonResponse({ message: 'boom' }, false, 500) : null,
    );

    await renderHome();

    await vi.waitFor(() => {
      expect($testId('items-list').find('.multistack__error').text()).toBe('✗ items: HTTP 500');
    });
  });

  it('renders the health error copy when the health check fails', async () => {
    stubApis((url) => (url.includes('/api/health') ? jsonResponse({}, false, 503) : null));

    await renderHome();

    await vi.waitFor(() => {
      expect($testId('health-status').text()).toBe('✗ health: HTTP 503');
    });
    expect($testId('health-status').hasClass('multistack__error')).toBe(true);
  });

  it('keeps the session panel hidden without a session token', async () => {
    await renderHome();

    await vi.waitFor(() => {
      expect($testId('item-row')).toHaveLength(1);
    });
    expect($testId('welcome-panel').prop('hidden')).toBe(true);
    expect(fetchCalls('GET', '/api/auth/me')).toHaveLength(0);
  });

  it('shows welcome, logout and delete account when profile loads for a session token', async () => {
    localStorage.setItem('authToken', 'valid-token');

    await renderHome();
    await waitForWelcome();

    expect($testId('welcome-panel').prop('hidden')).toBe(false);
    expect($testId('logout-button').text()).toBe('Logout');
    expect($testId('delete-account-button').text()).toBe('Delete account');
  });

  it('logs out, clears the session and lands on /login', async () => {
    localStorage.setItem('authToken', 'valid-token');
    await renderHome();
    await waitForWelcome();

    click('logout-button');

    await vi.waitFor(() => {
      expect(locationStub.href).toBe('/login');
    });
    expect(fetchCalls('POST', '/api/auth/logout')).toHaveLength(1);
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('deletes the account, clears the session and lands on /login', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    localStorage.setItem('authToken', 'valid-token');
    await renderHome();
    await waitForWelcome();

    click('delete-account-button');

    await vi.waitFor(() => {
      expect(locationStub.href).toBe('/login');
    });
    expect(confirmSpy).toHaveBeenCalledWith('Delete this account? This cannot be undone.');
    const deleteCalls = fetchCalls('DELETE', '/api/auth/me');
    expect(deleteCalls).toHaveLength(1);
    expect(deleteCalls[0][1]).toMatchObject({
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    });
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('cancelling the confirm keeps the session and sends no delete request', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    localStorage.setItem('authToken', 'valid-token');
    await renderHome();
    await waitForWelcome();

    click('delete-account-button');

    expect(confirmSpy).toHaveBeenCalledOnce();
    expect(fetchCalls('DELETE', '/api/auth/me')).toHaveLength(0);
    expect(locationStub.href).toBe('http://localhost/');
    expect(localStorage.getItem('authToken')).toBe('valid-token');
  });

  // Mirrors logout: the local session goes even when the API refuses the token.
  it('clears the session when the delete call is rejected', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    localStorage.setItem('authToken', 'valid-token');
    stubApis((url, init) =>
      url.includes('/api/auth/me') && init?.method === 'DELETE'
        ? jsonResponse({ message: 'Unauthorized' }, false, 401)
        : null,
    );
    await renderHome();
    await waitForWelcome();

    click('delete-account-button');

    await vi.waitFor(() => {
      expect(locationStub.href).toBe('/login');
    });
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('clears an invalid session and keeps the session panel hidden', async () => {
    localStorage.setItem('authToken', 'bad-token');
    stubApis((url, init) =>
      url.includes('/api/auth/me') && init?.method !== 'DELETE'
        ? jsonResponse({ message: 'Unauthorized' }, false, 401)
        : null,
    );

    await renderHome();

    await vi.waitFor(() => {
      expect(localStorage.getItem('authToken')).toBeNull();
    });
    expect($testId('welcome-panel').prop('hidden')).toBe(true);
    expect($testId('welcome-message').text()).toBe('');
  });

  it('publishes the header config for the home nav item', async () => {
    await renderHome();

    expect(window.headerConfig?.nav.map((item) => [item.testid, item.active])).toEqual([
      ['header-nav-home', true],
      ['header-nav-login', false],
      ['header-nav-register', false],
      ['header-nav-stack', false],
      ['header-nav-stage', undefined],
      ['header-nav-prod', undefined],
    ]);
    expect(document.querySelector('script[data-header-embed]')).toHaveProperty(
      'type',
      'module',
    );
  });

  it('shows checking copy in the stored language while health is pending', async () => {
    localStorage.setItem('zds-lang', 'ru');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {})),
    );

    await renderHome();

    expect($testId('health-status').text()).toBe(ru.home.healthChecking);
    expect($testId('items-list').text()).toContain(ru.home.itemsLoading);
  });

  it('retranslates chrome on header:lang-change and keeps API payloads', async () => {
    localStorage.setItem('authToken', 'valid-token');
    await renderHome();
    await waitForWelcome();

    expect($testId('item-row').find('.panel__title').text()).toBe('Alpha');

    dispatchLang('ru');

    expect($testId('welcome-message').text()).toBe('Добро пожаловать, user1!');
    expect($testId('logout-button').text()).toBe(ru.home.logout);
    expect($testId('delete-account-button').text()).toBe(ru.home.deleteAccount);
    expect($testId('health-status').text()).toBe(
      '→ UP | сервис: backend-java-spring | фронтенд: frontend-typescript-jquery',
    );
    expect($testId('item-row').find('.panel__title').text()).toBe('Alpha');
    expect($('#home-blurb').text()).toBe('Демо TypeScript jQuery — элементы из /api/items.');
    expect(document.documentElement.lang).toBe('ru');
  });

  it('asks to confirm delete in the active language', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    localStorage.setItem('authToken', 'valid-token');
    await renderHome();
    await waitForWelcome();

    dispatchLang('ru');
    click('delete-account-button');

    expect(confirmSpy).toHaveBeenCalledWith(ru.home.deleteConfirm);
  });

  it('retranslates empty items chrome without touching API names', async () => {
    stubApis((url) => (url.includes('/api/items') ? jsonResponse({ items: [] }) : null));
    await renderHome();
    await vi.waitFor(() => {
      expect($testId('items-list').text()).toContain('No items found.');
    });

    dispatchLang('ru');
    expect($testId('items-list').text()).toContain(ru.home.itemsEmpty);
  });

  it('keeps items error payload and translates the prefix', async () => {
    stubApis((url) =>
      url.includes('/api/items') ? jsonResponse({ message: 'boom' }, false, 500) : null,
    );
    await renderHome();
    await vi.waitFor(() => {
      expect($testId('items-list').find('.multistack__error').text()).toBe('✗ items: HTTP 500');
    });

    dispatchLang('ru');
    expect($testId('items-list').find('.multistack__error').text()).toBe('✗ элементы: HTTP 500');
  });

  it('shows health error state in the active language', async () => {
    stubApis((url) => (url.includes('/api/health') ? jsonResponse({}, false, 503) : null));
    await renderHome();
    await vi.waitFor(() => {
      expect($testId('health-status').text()).toBe('✗ health: HTTP 503');
    });

    dispatchLang('ru');
    expect($testId('health-status').text()).toBe('✗ статус: HTTP 503');
  });
});
