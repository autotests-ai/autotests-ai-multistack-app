(function () {
  const PATH_RE = /^\/(backend-[^/]+)\/(frontend-[^/]+)/;
  const rowsBackendEl = document.getElementById("rows-backend");
  const rowsFrontendEl = document.getElementById("rows-frontend");
  const summaryEl = document.getElementById("summary");
  const footEl = document.getElementById("foot");
  const errEl = document.getElementById("err");
  const currentEl = document.getElementById("current");

  function parseMount(pathname) {
    const match = pathname.match(PATH_RE);
    if (match) {
      return { backendId: match[1], frontendId: match[2] };
    }
    const fe = pathname.match(/^\/(frontend-[^/]+)/);
    return {
      backendId: null,
      frontendId: fe ? fe[1] : null,
    };
  }

  function isOpenable(status) {
    return status === "active" || status === "stub";
  }

  function comboHref(backendId, frontendId, path = "/") {
    let p = path == null || path === "" ? "/" : String(path);
    if (p.charAt(0) !== "/") p = `/${p}`;
    if (!backendId || !frontendId) {
      return frontendId ? `/${frontendId}${p === "/" ? "/" : p}` : p;
    }
    return `/${backendId}/${frontendId}${p === "/" ? "/" : p}`;
  }

  function stackHref(backendId, frontendId) {
    return comboHref(backendId, frontendId, "/stack/");
  }

  function badge(status) {
    if (status === "slot") {
      return '<span class="badge badge--slot">slot</span>';
    }
    if (status === "stub") {
      return '<span class="badge badge--slot">stub</span>';
    }
    return '<span class="badge badge--ok">active</span>';
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function rowHtml(item, kind, currentBackend, currentFrontend) {
    const id = item.id;
    const status = item.status || "active";
    const meta =
      kind === "backend"
        ? `${escapeHtml(item.language || "backend")} · ${escapeHtml(status)}`
        : `${escapeHtml(item.kind || "frontend")} · ${escapeHtml(status)}`;
    const isCurrent =
      kind === "backend" ? id === currentBackend : id === currentFrontend;
    const targetBackend = kind === "backend" ? id : currentBackend;
    const targetFrontend = kind === "frontend" ? id : currentFrontend;
    const href = stackHref(targetBackend, targetFrontend);
    const openable = isOpenable(status) && targetBackend && targetFrontend;

    const nameCell = openable
      ? `<a class="id stack-link${isCurrent ? " is-active" : ""}" href="${escapeHtml(href)}" data-testid="stack-${kind}-${escapeHtml(id)}">${escapeHtml(id)}</a>`
      : `<span class="id stack-link stack-link--disabled${isCurrent ? " is-active" : ""}" data-testid="stack-${kind}-${escapeHtml(id)}">${escapeHtml(id)}</span>`;

    return `<tr class="${isCurrent ? "row--active" : ""}">
      <td>
        ${nameCell}
        <div class="meta">${meta}</div>
      </td>
      <td>${badge(status)}</td>
      <td>${
        openable
          ? `<a class="stack-open${isCurrent ? " is-active" : ""}" href="${escapeHtml(href)}">open →</a>`
          : '<span class="meta">—</span>'
      }</td>
    </tr>`;
  }

  function render(data) {
    errEl.classList.remove("show");
    const { backendId, frontendId } = parseMount(window.location.pathname);
    const backends = data.backends || [];
    const frontends = data.frontends || [];
    const activeBe = backends.filter((b) => isOpenable(b.status)).length;
    const activeFe = frontends.filter((f) => isOpenable(f.status)).length;
    const slotBe = backends.length - activeBe;
    const slotFe = frontends.length - activeFe;

    summaryEl.innerHTML = [
      `<span class="pill pill--ok">backend active ${activeBe}</span>`,
      `<span class="pill">backend slot ${slotBe}</span>`,
      `<span class="pill pill--ok">frontend active ${activeFe}</span>`,
      `<span class="pill">frontend slot ${slotFe}</span>`,
    ].join("");

    if (currentEl) {
      const label =
        backendId && frontendId
          ? `${backendId} · ${frontendId}`
          : frontendId
            ? `(no backend prefix) · ${frontendId}`
            : "path without /{backend}/{frontend}/";
      const href = comboHref(backendId, frontendId, "/");
      currentEl.innerHTML = `<a class="current__link" href="${escapeHtml(href)}" title="open app home">${escapeHtml(label)}</a>`;
    }

    rowsBackendEl.innerHTML = backends
      .map((b) => rowHtml(b, "backend", backendId, frontendId))
      .join("");
    rowsFrontendEl.innerHTML = frontends
      .map((f) => rowHtml(f, "frontend", backendId, frontendId))
      .join("");

    footEl.textContent =
      "matrix.json ← deploy/matrix.yaml · click active → /{backend}/{frontend}/stack/";
  }

  async function load() {
    try {
      const res = await fetch("./matrix.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      render(await res.json());
    } catch (e) {
      errEl.textContent =
        "Не удалось загрузить matrix.json — sync: python frontend/scripts/sync-stack-matrix.py. " +
        e;
      errEl.classList.add("show");
    }
  }

  load();
})();
