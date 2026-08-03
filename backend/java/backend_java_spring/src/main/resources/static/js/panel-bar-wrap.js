/**
 * Content-driven wrap for terminal panel bars (format tabs + hash + actions).
 *
 * One row while dots + tabs + meta + actions fit.
 * `.panel__bar--wrap` — tabs collide with hash → tabs on band 2; chrome
 *   (dots / hash / actions) stays on band 1. Tags align with dots.
 * `.panel__bar--wrap-meta` — hash bumps into dots → hash on band 2, tabs on
 *   band 3; dots + actions stay top corners.
 *
 * ResizeObserver — not a fixed px breakpoint. Plain script, file:// OK.
 */
(function (global) {
  "use strict";

  var SELECTOR = ".panel__bar:has(> .panel__trail > .tabs)";
  var WRAP = "panel__bar--wrap";
  var WRAP_META = "panel__bar--wrap-meta";
  /** px: enter wrap when content overflows by this much */
  var SLACK_ENTER = 1;
  /** px: unwrap only when this much spare room exists (anti-flicker band) */
  var SLACK_EXIT = 24;

  function gapPx(styles) {
    var raw = styles.columnGap || styles.gap || "0";
    return parseFloat(String(raw).split(" ")[0]) || 0;
  }

  function requiredWidth(parts, gap, pad) {
    return (
      parts.reduce(function (sum, w) {
        return sum + w;
      }, 0) +
      (parts.length - 1) * gap +
      pad
    );
  }

  /**
   * Intrinsic one-row tabs width. Do NOT use tabs.scrollWidth — when
   * `.panel__bar--wrap` sets tabs to width:100%, scrollWidth ≈ bar width and
   * unwrap can never fire.
   */
  function tabsRowWidth(tabs) {
    var kids = tabs.children;
    var n = kids.length;
    if (!n) return 0;
    var w = 0;
    for (var i = 0; i < n; i++) w += kids[i].offsetWidth;
    var gap = gapPx(getComputedStyle(tabs));
    if (n > 1) w += (n - 1) * gap;
    return w;
  }

  function hysteretic(overflows, currentlyOn) {
    if (currentlyOn) return overflows.exit;
    return overflows.enter;
  }

  function measure(bar) {
    var dots = bar.querySelector(":scope > .panel__dots");
    var trail = bar.querySelector(":scope > .panel__trail");
    var tabs = trail && trail.querySelector(":scope > .tabs");
    if (!dots || !tabs) return null;

    var available = bar.clientWidth;
    if (available <= 0) return null;

    var meta = bar.querySelector(":scope > .panel__bar-end");
    var actions = bar.querySelector(":scope > .panel__actions");
    var styles = getComputedStyle(bar);
    var pad =
      (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
    var gap = gapPx(styles);

    var chrome = [dots.offsetWidth];
    if (meta) chrome.push(meta.offsetWidth);
    if (actions) chrome.push(actions.offsetWidth);

    var full = chrome.slice();
    full.splice(1, 0, tabsRowWidth(tabs));

    return {
      available: available,
      pad: pad,
      gap: gap,
      chrome: chrome,
      full: full,
      hasMeta: Boolean(meta),
    };
  }

  function needsWrap(m, currentlyOn) {
    var required = requiredWidth(m.full, m.gap, m.pad);
    return hysteretic(
      {
        enter: required > m.available + SLACK_ENTER,
        exit: required > m.available - SLACK_EXIT,
      },
      currentlyOn
    );
  }

  /** Hash bumps into dots when chrome alone (no tabs) overflows. */
  function needsMetaWrap(m, currentlyOn) {
    if (!m.hasMeta) return false;
    var required = requiredWidth(m.chrome, m.gap, m.pad);
    return hysteretic(
      {
        enter: required > m.available + SLACK_ENTER,
        exit: required > m.available - SLACK_EXIT,
      },
      currentlyOn
    );
  }

  function sync(bar) {
    if (!bar || !bar.classList) return;
    var m = measure(bar);
    if (!m) return;

    var metaNext = needsMetaWrap(m, bar.classList.contains(WRAP_META));
    /* Meta wrap implies tabs wrap (chrome overflow ⇒ full row overflows). */
    var wrapNext = metaNext || needsWrap(m, bar.classList.contains(WRAP));

    if (bar.classList.contains(WRAP) !== wrapNext) {
      bar.classList.toggle(WRAP, wrapNext);
    }
    if (bar.classList.contains(WRAP_META) !== metaNext) {
      bar.classList.toggle(WRAP_META, metaNext);
    }
  }

  function scheduleSync(bar) {
    if (!bar || bar._panelBarWrapRaf) return;
    bar._panelBarWrapRaf = requestAnimationFrame(function () {
      bar._panelBarWrapRaf = 0;
      sync(bar);
    });
  }

  function observe(bar) {
    if (!bar || bar._panelBarWrapRo) return;
    sync(bar);
    if (typeof ResizeObserver === "undefined") return;
    var ro = new ResizeObserver(function () {
      scheduleSync(bar);
    });
    ro.observe(bar);
    var panel = bar.closest(".panel");
    if (panel) ro.observe(panel);
    bar._panelBarWrapRo = ro;

    /* Hash / tab label changes — not bar size. Debounced; no attribute watch (wrap class). */
    if (typeof MutationObserver !== "undefined") {
      var mo = new MutationObserver(function () {
        scheduleSync(bar);
      });
      mo.observe(bar, { characterData: true, childList: true, subtree: true });
      bar._panelBarWrapMo = mo;
    }
  }

  function init(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var bars = scope.querySelectorAll(SELECTOR);
    for (var i = 0; i < bars.length; i++) observe(bars[i]);
  }

  function syncAll(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var bars = scope.querySelectorAll(SELECTOR);
    for (var i = 0; i < bars.length; i++) sync(bars[i]);
  }

  global.PanelBarWrap = { init: init, sync: sync, syncAll: syncAll };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      init();
    });
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);
