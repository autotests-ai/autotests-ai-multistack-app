/**
 * Stack matrix helpers — SSOT logic for /stack/ (vanilla mount + SPA imports).
 * Data: ../stack/matrix.json ← python frontend/scripts/sync-stack-matrix.py
 */

const PATH_RE = /^\/(backend-[^/]+)\/(frontend-[^/]+)/;

export function parseMount(pathname) {
  const match = String(pathname || '').match(PATH_RE);
  if (match) {
    return { backendId: match[1], frontendId: match[2] };
  }
  const fe = String(pathname || '').match(/^\/(frontend-[^/]+)/);
  return {
    backendId: null,
    frontendId: fe ? fe[1] : null,
  };
}

export function isOpenable(status) {
  return status === 'active' || status === 'stub';
}

export function comboHref(backendId, frontendId, path = '/') {
  let p = path == null || path === '' ? '/' : String(path);
  if (p.charAt(0) !== '/') p = `/${p}`;
  if (!backendId || !frontendId) {
    return frontendId ? `/${frontendId}${p === '/' ? '/' : p}` : p;
  }
  return `/${backendId}/${frontendId}${p === '/' ? '/' : p}`;
}

export function stackHref(backendId, frontendId) {
  return comboHref(backendId, frontendId, '/stack/');
}

export function summarizeMatrix(data) {
  return {
    backends: data?.backends || [],
    frontends: data?.frontends || [],
  };
}

export function matrixUrlFromPage() {
  // Prefer sibling matrix.json under /stack/ (works with APP_BASE prefix).
  try {
    return new URL('matrix.json', window.location.href).pathname;
  } catch {
    return './matrix.json';
  }
}

export async function fetchMatrix(url) {
  const res = await fetch(url || matrixUrlFromPage(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusBadge(status) {
  if (status === 'slot' || status === 'stub') {
    return `<span class="badge" data-status="${escapeHtml(status)}">${escapeHtml(status)}</span>`;
  }
  return `<span class="badge badge--primary" data-status="active">active</span>`;
}

function rowHtml(item, kind, currentBackend, currentFrontend) {
  const id = item.id;
  const status = item.status || 'active';
  const meta =
    kind === 'backend'
      ? `${escapeHtml(item.language || 'backend')} · ${escapeHtml(status)}`
      : `${escapeHtml(item.kind || 'frontend')} · ${escapeHtml(status)}`;
  const isCurrent = kind === 'backend' ? id === currentBackend : id === currentFrontend;
  const targetBackend = kind === 'backend' ? id : currentBackend;
  const targetFrontend = kind === 'frontend' ? id : currentFrontend;
  const href = stackHref(targetBackend, targetFrontend);
  const openable = isOpenable(status) && targetBackend && targetFrontend;

  const nameCell = openable
    ? `<a class="link stack-page__id${isCurrent ? ' is-active' : ''}" href="${escapeHtml(href)}" data-testid="stack-${kind}-${escapeHtml(id)}">${escapeHtml(id)}</a>`
    : `<span class="stack-page__id stack-page__id--disabled${isCurrent ? ' is-active' : ''}" data-testid="stack-${kind}-${escapeHtml(id)}">${escapeHtml(id)}</span>`;

  return `<tr class="${isCurrent ? 'stack-page__row--active' : ''}">
    <td>
      ${nameCell}
      <div class="text text--sm text--muted stack-page__meta">${meta}</div>
    </td>
    <td>${statusBadge(status)}</td>
    <td>${
      openable
        ? `<a class="link stack-page__open${isCurrent ? ' is-active' : ''}" href="${escapeHtml(href)}">open →</a>`
        : '<span class="text text--sm text--muted">—</span>'
    }</td>
  </tr>`;
}

/**
 * Mount product stack boards into `root` (vanilla). Expects empty container.
 */
export function mountStackPage(root, data, pathname = window.location.pathname) {
  if (!root) return;
  const { backendId, frontendId } = parseMount(pathname);
  const summary = summarizeMatrix(data);
  const label =
    backendId && frontendId
      ? `${backendId} · ${frontendId}`
      : frontendId
        ? `(no backend prefix) · ${frontendId}`
        : 'path without /{backend}/{frontend}/';
  const homeHref = comboHref(backendId, frontendId, '/');

  root.innerHTML = `
    <div class="stack-page__header">
      <h1 class="stack-page__title">Stack</h1>
      <a class="badge badge--primary stack-page__current" href="${escapeHtml(homeHref)}" title="open app home" data-testid="stack-current-pair">${escapeHtml(label)}</a>
    </div>
    <div class="stack-page__boards">
      <section class="panel panel--content stack-page__board">
        <div class="panel__bar">
          <div class="panel__dots" aria-hidden="true">
            <span class="panel__dot"></span><span class="panel__dot"></span><span class="panel__dot"></span>
          </div>
          <div class="panel__trail"><span class="panel__title">Backend</span></div>
        </div>
        <div class="panel__body stack-page__board-body">
          <table class="stack-page__table">
            <thead><tr><th>Module</th><th>Status</th><th>Open</th></tr></thead>
            <tbody>
              ${summary.backends.map((b) => rowHtml(b, 'backend', backendId, frontendId)).join('')}
            </tbody>
          </table>
        </div>
      </section>
      <section class="panel panel--content stack-page__board">
        <div class="panel__bar">
          <div class="panel__dots" aria-hidden="true">
            <span class="panel__dot"></span><span class="panel__dot"></span><span class="panel__dot"></span>
          </div>
          <div class="panel__trail"><span class="panel__title">Frontend</span></div>
        </div>
        <div class="panel__body stack-page__board-body">
          <table class="stack-page__table">
            <thead><tr><th>Module</th><th>Status</th><th>Open</th></tr></thead>
            <tbody>
              ${summary.frontends.map((f) => rowHtml(f, 'frontend', backendId, frontendId)).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    <p class="text text--sm text--muted stack-page__foot">
      matrix.json ← deploy/matrix.yaml · click active → /{backend}/{frontend}/stack/
    </p>
  `;
}

export async function bootStackPage(root, options = {}) {
  const errEl = options.errEl || null;
  try {
    if (errEl) {
      errEl.hidden = true;
      errEl.textContent = '';
    }
    const data = await fetchMatrix(options.matrixUrl);
    mountStackPage(root, data, options.pathname || window.location.pathname);
  } catch (e) {
    if (errEl) {
      errEl.hidden = false;
      errEl.textContent =
        'Не удалось загрузить matrix.json — sync: python frontend/scripts/sync-stack-matrix.py. ' +
        e;
    } else if (root) {
      root.innerHTML = `<p class="text reference-app__error" data-testid="stack-error">Не удалось загрузить matrix.json — ${escapeHtml(String(e))}</p>`;
    }
  }
}
