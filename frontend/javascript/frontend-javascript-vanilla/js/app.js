const healthStatus = document.querySelector('[data-testid="health-status"]');
const itemsList = document.querySelector('[data-testid="items-list"]');
const welcomeMessage = document.querySelector('[data-testid="welcome-message"]');
const welcomePanel = document.querySelector('[data-testid="welcome-panel"]');
const logoutButton = document.getElementById('logout-button');
const deleteAccountButton = document.getElementById('delete-account-button');
const homeBlurb = document.getElementById('home-blurb');

var healthState = { status: 'checking' };
var itemsState = { status: 'loading' };
var welcomeName = null;

function currentCopy() {
  return I18n.dictionaries[I18n.readStoredLang()];
}

function renderBlurb(template) {
  var parts = String(template).split('{api}');
  homeBlurb.replaceChildren(
    document.createTextNode(parts[0] || ''),
    Object.assign(document.createElement('code'), { textContent: '/api/items' }),
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
      `<p class="multistack__error">${ReferenceAuth.formatMessage(copy.home.itemsError, {
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

function renderHealth(copy) {
  if (healthState.status === 'checking') {
    healthStatus.textContent = copy.home.healthChecking;
    healthStatus.classList.remove('multistack__error');
    return;
  }
  if (healthState.status === 'ok') {
    healthStatus.textContent = ReferenceAuth.formatMessage(copy.home.healthOk, {
      status: healthState.health,
      service: healthState.service,
      frontend: window.UI_MOUNT,
    });
    healthStatus.classList.remove('multistack__error');
    return;
  }
  healthStatus.textContent = ReferenceAuth.formatMessage(copy.home.healthError, {
    message: healthState.message,
  });
  healthStatus.classList.add('multistack__error');
}

function renderSession(copy) {
  if (welcomeName === null) {
    welcomePanel.hidden = true;
    welcomeMessage.textContent = '';
    return;
  }
  welcomeMessage.textContent = ReferenceAuth.formatMessage(copy.home.welcome, {
    username: welcomeName,
  });
  welcomePanel.hidden = false;
}

function applyHomeCopy(copy) {
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
  if (!window.ReferenceAuth || !ReferenceAuth.getToken()) {
    return;
  }

  try {
    const profile = await ReferenceAuth.fetchProfile();
    welcomeName = profile.username;
  } catch (error) {
    ReferenceAuth.clearSession();
    welcomeName = null;
  }
  renderSession(currentCopy());
}

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    await ReferenceAuth.logout();
    window.location.href = appPath('/login');
  });
}

if (deleteAccountButton) {
  deleteAccountButton.addEventListener('click', async () => {
    if (!window.confirm(currentCopy().home.deleteConfirm)) {
      return;
    }
    await ReferenceAuth.deleteAccount();
    window.location.href = appPath('/login');
  });
}

startI18n(applyHomeCopy);
loadHealth();
loadItems();
loadSession();
