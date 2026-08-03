import { fetchTemplateText } from './dom-utils.js';

const TEMPLATE_URLS = [
  new URL('../templates/plaque-field.html', import.meta.url),
  new URL('../templates/plaque-field-grid.html', import.meta.url),
];

/** @type {Map<string, Element> | null} */
let templateRegistry = null;

function indexTemplates(root) {
  const registry = new Map();
  root.querySelectorAll('[data-testid]').forEach(function (node) {
    registry.set(node.dataset.testid, node);
  });
  return registry;
}

export async function initPlaqueTemplates() {
  if (templateRegistry) {
    return templateRegistry;
  }

  const parts = await Promise.all(TEMPLATE_URLS.map(fetchTemplateText));
  const host = document.createElement('div');
  host.innerHTML = parts.join('\n');
  templateRegistry = indexTemplates(host);
  return templateRegistry;
}

/**
 * @param {string} testid
 * @returns {Element}
 */
export function clonePlaqueTemplate(testid) {
  if (!templateRegistry) {
    throw new Error('plaque-field.js: call initPlaqueTemplates() before clonePlaqueTemplate');
  }
  const template = templateRegistry.get(testid);
  if (!template) {
    throw new Error('plaque-field.js: unknown template data-testid="' + testid + '"');
  }
  return template.cloneNode(true);
}

/** Full-width row — label column + divider left; control slot right (plaque-field.css). */
export function applyPlaqueStretch(node) {
  if (node && node.classList && node.classList.contains('plaque-field--divided')) {
    node.classList.add('plaque-field--stretch');
  }
  return node;
}

/**
 * Magnet label cols for `.plaque-field-grid-stack--magnet` —
 * per vertical column `--plaque-mixed-label-col` = max(label scrollWidths),
 * capped so control keeps ≥ ~4.5rem.
 * Prefer `plaque-field-magnet.js` on static file:// presets.
 * @param {ParentNode} [root=document]
 */
export function syncPlaqueMagnetStacks(root) {
  if (typeof window !== 'undefined' && typeof window.syncPlaqueMagnetStacks === 'function') {
    window.syncPlaqueMagnetStacks(root || document);
    return;
  }
  const scope = root || document;
  const MIN_CONTROL_PX = 72;
  scope.querySelectorAll('.plaque-field-grid-stack--magnet').forEach((stack) => {
    const rows = [...stack.children].filter(
      (el) => el.classList && el.classList.contains('plaque-field-grid'),
    );
    if (!rows.length) return;

    /** Visual columns (cell left) — same as plaque-field-magnet.js when duo auto-fits. */
    /** @type {Map<number, { field: Element, label: Element, cell: Element }[]>} */
    const colMap = new Map();

    rows.forEach((row) => {
      [...row.children].forEach((cell) => {
        if (!cell.classList || !cell.classList.contains('plaque-field-grid__cell')) return;
        const field = cell.querySelector(':scope > .plaque-field--divided');
        const label =
          field &&
          field.querySelector(':scope > .plaque-field__label, :scope > .plaque-field__text');
        if (!field || !label) return;
        field.style.removeProperty('--plaque-mixed-label-col');
        const key = Math.round(cell.getBoundingClientRect().left / 4) * 4;
        if (!colMap.has(key)) colMap.set(key, []);
        colMap.get(key).push({ field, label, cell });
      });
    });

    void stack.offsetWidth;

    colMap.forEach((items) => {
      if (!items.length) return;
      let maxW = 0;
      let cap = Infinity;
      items.forEach(({ label, cell }) => {
        maxW = Math.max(maxW, Math.ceil(label.scrollWidth));
        const cellW = Math.floor(cell.getBoundingClientRect().width);
        cap = Math.min(cap, Math.max(0, cellW - MIN_CONTROL_PX - 1));
      });
      const px = Math.min(maxW, cap) + 'px';
      if (!maxW) return;
      items.forEach(({ field }) => {
        field.style.setProperty('--plaque-mixed-label-col', px);
      });
    });
  });
}
