import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * Runs a shipped script the way its `<script>` tag would: no module wrapper, `window`
 * and `$` as free variables, and `module`/`exports`/`define` left undefined so the
 * vendored UMD jQuery bundle takes its browser branch instead of the CommonJS one.
 */
export function loadScript(relativePath, pageWindow = window) {
  const source = readFileSync(resolve(MODULE_ROOT, relativePath), 'utf8');
  const run = new Function(
    'window',
    'document',
    '$',
    'jQuery',
    'module',
    'exports',
    'define',
    source,
  );
  run(pageWindow, window.document, window.jQuery, window.jQuery, undefined, undefined, undefined);
}

/** jQuery itself always binds to the real jsdom window — that is where the DOM lives. */
export function loadJQuery() {
  loadScript('vendor/jquery.min.js');
}

/** app-base.js + auth.js, in page order, so `window.ReferenceAuth` is rebuilt per test. */
export function loadAuthRuntime() {
  loadScript('js/app-base.js');
  loadScript('js/auth.js');
}

/**
 * The pages navigate with `window.location.href = …`, which jsdom refuses to do. Handing
 * the page script a window whose `location` is a plain object keeps the production line
 * of code intact and makes the destination assertable.
 */
export function createPageWindow() {
  const location = {
    href: window.location.href,
    replace(url) {
      location.href = url;
    },
  };

  return new Proxy(window, {
    get(target, property) {
      if (property === 'location') return location;
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
    set(target, property, value) {
      if (property === 'location') {
        location.href = String(value);
        return true;
      }
      return Reflect.set(target, property, value, target);
    },
  });
}

/** Resolves after the page's own `$(function () { … })` handler has run. */
export function whenReady() {
  return new Promise((resolveReady) => {
    window.jQuery(resolveReady);
  });
}

/** The `<main>` of a shipped page — tests drive the markup that actually ships. */
export function mainMarkup(page) {
  const html = readFileSync(resolve(MODULE_ROOT, page), 'utf8');
  const main = /<main[\s\S]*<\/main>/.exec(html);
  if (!main) {
    throw new Error(`No <main> element found in ${page}`);
  }
  return main[0];
}

export function jsonResponse(body, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}
