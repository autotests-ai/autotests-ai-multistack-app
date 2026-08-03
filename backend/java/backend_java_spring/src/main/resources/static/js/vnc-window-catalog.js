(function () {
  "use strict";

  var icons = {
    close: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m4 4 8 8M12 4l-8 8"/></svg>',
    trash: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4.5h11"/><path d="M6 4.5V3.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"/><path d="M4.5 4.5l.7 8a1.5 1.5 0 0 0 1.5 1.3h3.6a1.5 1.5 0 0 0 1.5-1.3l.7-8"/><path d="M6.5 7v4M9.5 7v4"/></svg>',
    documentRemove: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2.5h5l3 3v8H4z"/><path d="M9 2.5v3h3M6 10h4"/></svg>',
    dots: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 8h.01M8 8h.01M13 8h.01"/></svg>',
    lock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>',
    unlock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M10.5 7V5a2.5 2.5 0 0 0-4.75-1.1"/></svg>',
    up: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m4 10 4-4 4 4"/></svg>',
    down: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m4 6 4 4 4-4"/></svg>',
    copy: '<svg viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M5 11H4a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 4 2.5h5.5A1.5 1.5 0 0 1 11 4v1" stroke="currentColor" stroke-width="1.5"/></svg>',
    upload: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 10V3m0 0L5.25 5.75M8 3l2.75 2.75"/><path d="M3 10v2.5A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V10"/></svg>'
  };

  function icon(name) {
    return '<span class="icon" aria-hidden="true">' + icons[name] + "</span>";
  }

  function control(tone, name, label, extraClass) {
    return '<button type="button" class="window-control window-control--' + tone + (extraClass ? " " + extraClass : "") +
      '" aria-label="' + label + '" title="' + label + '">' + icon(name) + "</button>";
  }

  function status(state) {
    if (state === "connected" || state === "unlocked" || state === "fullscreen") {
      return '<span class="connection-status connection-status--connected" role="status" aria-label="VNC connected"></span>';
    }
    var glyph = state === "disconnected" ? "documentRemove" : "dots";
    return '<span class="connection-status connection-status--' + state + '" role="status" aria-label="VNC ' + state + '">' + icon(glyph) + "</span>";
  }

  function render(state, withKill) {
    var connected = state === "connected" || state === "unlocked" || state === "fullscreen";
    var windowState = connected ? "connected" : state;
    var fullscreen = state === "fullscreen";
    var unlocked = state === "unlocked";
    var external = connected ? "" : "VNC " + state;
    var killControl =
      withKill && connected
        ? control("danger", "trash", "Kill container", "vnc-window__session-control")
        : "";

    return '<div class="vnc-window-frame' + (fullscreen ? " vnc-window-frame--fullscreen" : "") + '">' +
      '<div class="panel panel--vnc vnc-window vnc-window--' + windowState + (fullscreen ? " vnc-window--fullscreen" : "") + '" data-state="' + windowState + '">' +
        '<div class="panel__bar">' +
          '<div class="vnc-window__controls">' +
            control("danger", "close", "Back") +
            status(state) +
            control("info", unlocked ? "unlock" : "lock", unlocked ? "Lock screen" : "Unlock screen", "vnc-window__session-control") +
            control("success", fullscreen ? "down" : "up", fullscreen ? "Exit fullscreen" : "Enter fullscreen", "vnc-window__session-control") +
          '</div>' +
          '<div class="vnc-window__actions">' +
            killControl +
            control("neutral", "copy", "Copy from Selenoid") +
            control("neutral", "upload", "Paste to Selenoid") +
          '</div>' +
        '</div>' +
        '<div class="vnc-window__screen"><div class="vnc-window__screen-mount" aria-label="noVNC mount point"></div></div>' +
      '</div>' +
      '<div class="vnc-window__external-status" role="status" aria-live="polite">' + external + '</div>' +
    '</div>';
  }

  document.querySelectorAll("[data-vnc-demo-state]").forEach(function (demo) {
    var withKill = demo.hasAttribute("data-vnc-demo-kill");
    demo.insertAdjacentHTML("beforeend", render(demo.dataset.vncDemoState, withKill));
  });
})();
