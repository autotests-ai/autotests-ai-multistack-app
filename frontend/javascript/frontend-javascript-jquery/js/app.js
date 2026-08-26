$(function () {
  const $healthStatus = $('[data-testid="health-status"]');
  const $itemsList = $('[data-testid="items-list"]');
  const $welcomePanel = $('[data-testid="welcome-panel"]');
  const $welcomeMessage = $('[data-testid="welcome-message"]');
  const $logoutButton = $('[data-testid="logout-button"]');
  const $deleteAccountButton = $('[data-testid="delete-account-button"]');
  const $homeBlurb = $('#home-blurb');

  var healthState = { status: 'checking' };
  var itemsState = { status: 'loading' };
  var welcomeName = null;
  var activeLang = 'en';

  function currentCopy() {
    return window.I18n.dictionaries[window.I18n.langFromDetail(activeLang)];
  }

  function renderBlurb(template) {
    if (!$homeBlurb.length) {
      return;
    }
    var parts = String(template).split('{api}');
    $homeBlurb.empty().append(
      document.createTextNode(parts[0] || ''),
      $('<code>').text('/api/items'),
      document.createTextNode(parts[1] || ''),
    );
  }

  function renderPanelBar(title) {
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

  function renderContentPanel(title, bodyHtml, testId) {
    const testAttr = testId ? ` data-testid="${testId}"` : '';
    return `
    <div class="panel panel--content"${testAttr}>
      ${renderPanelBar(title)}
      <div class="panel__body">
        ${bodyHtml}
      </div>
    </div>`;
  }

  function renderItems(copy) {
    if (itemsState.status === 'loading') {
      $itemsList.html(
        renderContentPanel(copy.home.items, `<p class="text text--muted">${copy.home.itemsLoading}</p>`),
      );
      return;
    }
    if (itemsState.status === 'empty') {
      $itemsList.html(
        renderContentPanel(copy.home.items, `<p class="text text--muted">${copy.home.itemsEmpty}</p>`),
      );
      return;
    }
    if (itemsState.status === 'error') {
      $itemsList.html(
        renderContentPanel(
          copy.home.items,
          `<p class="multistack__error">${window.ReferenceAuth.formatMessage(copy.home.itemsError, {
            message: itemsState.message,
          })}</p>`,
        ),
      );
      return;
    }

    $itemsList.html(
      $.map(itemsState.items, (item) =>
        renderContentPanel(
          item.name,
          `<p class="text text--muted">${item.description}</p>`,
          'item-row',
        ),
      ).join(''),
    );
  }

  function renderHealth(copy) {
    if (healthState.status === 'checking') {
      $healthStatus.text(copy.home.healthChecking).removeClass('multistack__error');
      return;
    }
    if (healthState.status === 'ok') {
      $healthStatus
        .text(
          window.ReferenceAuth.formatMessage(copy.home.healthOk, {
            status: healthState.health,
            service: healthState.service,
            frontend: window.UI_MOUNT,
          }),
        )
        .removeClass('multistack__error');
      return;
    }
    $healthStatus
      .text(
        window.ReferenceAuth.formatMessage(copy.home.healthError, {
          message: healthState.message,
        }),
      )
      .addClass('multistack__error');
  }

  function renderSession(copy) {
    if (welcomeName === null) {
      $welcomePanel.prop('hidden', true);
      $welcomeMessage.text('');
      return;
    }
    $welcomeMessage.text(
      window.ReferenceAuth.formatMessage(copy.home.welcome, { username: welcomeName }),
    );
    $welcomePanel.prop('hidden', false);
  }

  function applyHomeCopy(copy, code) {
    if (code) {
      activeLang = code;
    }
    renderBlurb(copy.home.blurb);
    renderHealth(copy);
    renderItems(copy);
    renderSession(copy);
  }

  async function loadHealth() {
    try {
      const response = await fetch(window.apiUrl('/health'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      healthState = { status: 'ok', health: payload.status, service: payload.service };
    } catch (error) {
      healthState = { status: 'error', message: error.message };
    }
    renderHealth(currentCopy());
  }

  async function loadItems() {
    try {
      const response = await fetch(window.apiUrl('/items'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      const list = payload.items || [];
      itemsState = list.length ? { status: 'loaded', items: list } : { status: 'empty' };
    } catch (error) {
      itemsState = { status: 'error', message: error.message };
    }
    renderItems(currentCopy());
  }

  async function loadSession() {
    if (!window.ReferenceAuth || !window.ReferenceAuth.getToken()) {
      return;
    }

    try {
      const profile = await window.ReferenceAuth.fetchProfile();
      welcomeName = profile.username;
    } catch (error) {
      window.ReferenceAuth.clearSession();
      welcomeName = null;
    }
    renderSession(currentCopy());
  }

  $logoutButton.on('click', async function () {
    await window.ReferenceAuth.logout();
    window.location.href = window.appPath('/login');
  });

  $deleteAccountButton.on('click', async function () {
    if (!window.confirm(currentCopy().home.deleteConfirm)) {
      return;
    }
    await window.ReferenceAuth.deleteAccount();
    window.location.href = window.appPath('/login');
  });

  window.startI18n(applyHomeCopy);
  loadHealth();
  loadItems();
  loadSession();
});
