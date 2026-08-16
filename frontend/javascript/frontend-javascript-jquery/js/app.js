$(function () {
  const DELETE_ACCOUNT_CONFIRM = "Delete this account? This cannot be undone.";

  const $healthStatus = $('[data-testid="health-status"]');
  const $itemsList = $('[data-testid="items-list"]');
  const $welcomePanel = $('[data-testid="welcome-panel"]');
  const $welcomeMessage = $('[data-testid="welcome-message"]');
  const $logoutButton = $('[data-testid="logout-button"]');
  const $deleteAccountButton = $('[data-testid="delete-account-button"]');

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
    const testAttr = testId ? ` data-testid="${testId}"` : "";
    return `
    <div class="panel panel--content"${testAttr}>
      ${renderPanelBar(title)}
      <div class="panel__body">
        ${bodyHtml}
      </div>
    </div>`;
  }

  function renderItems(items) {
    if (!items.length) {
      $itemsList.html(
        renderContentPanel("Items", '<p class="text text--muted">No items found.</p>')
      );
      return;
    }

    $itemsList.html(
      $.map(items, (item) =>
        renderContentPanel(
          item.name,
          `<p class="text text--muted">${item.description}</p>`,
          "item-row"
        )
      ).join("")
    );
  }

  async function loadHealth() {
    try {
      const response = await fetch(window.apiUrl("/health"));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      $healthStatus.text(
        `→ ${payload.status} | service: ${payload.service} | frontend: ${window.UI_MOUNT}`
      );
    } catch (error) {
      $healthStatus.text(`✗ health: ${error.message}`).addClass("multistack__error");
    }
  }

  async function loadItems() {
    try {
      const response = await fetch(window.apiUrl("/items"));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      renderItems(payload.items || []);
    } catch (error) {
      $itemsList.html(
        renderContentPanel(
          "Items",
          `<p class="multistack__error">✗ items: ${error.message}</p>`
        )
      );
    }
  }

  async function loadSession() {
    if (!window.ReferenceAuth || !window.ReferenceAuth.getToken()) {
      return;
    }

    try {
      const profile = await window.ReferenceAuth.fetchProfile();
      $welcomeMessage.text("Welcome, " + profile.username + "!");
      $welcomePanel.prop("hidden", false);
    } catch (error) {
      window.ReferenceAuth.clearSession();
    }
  }

  $logoutButton.on("click", async function () {
    await window.ReferenceAuth.logout();
    window.location.href = window.appPath("/login");
  });

  $deleteAccountButton.on("click", async function () {
    if (!window.confirm(DELETE_ACCOUNT_CONFIRM)) {
      return;
    }
    await window.ReferenceAuth.deleteAccount();
    window.location.href = window.appPath("/login");
  });

  loadHealth();
  loadItems();
  loadSession();
});
