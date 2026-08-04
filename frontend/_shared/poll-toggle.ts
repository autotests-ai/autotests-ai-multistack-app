/** Poll toggle binder — SSOT twin of `frontend-javascript-app/js/poll-toggle.js`. */

export const POLL_DEFAULT_MS = 5000;

export function formatPollLabel(ms: number): string {
  const safe = Number.isFinite(ms) && ms > 0 ? Math.round(ms) : POLL_DEFAULT_MS;
  if (safe % 1000 === 0) return `${safe / 1000}s`;
  return `${safe}ms`;
}

const REFRESH_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12a9 9 0 1 1-2.64-6.36"/>
    <path d="M21 3v6h-6"/>
  </svg>
`;

export function pollToggleMarkup(options: {
  intervalMs?: number;
  on?: boolean;
  testid?: string;
} = {}): string {
  const intervalMs = options.intervalMs ?? POLL_DEFAULT_MS;
  const on = options.on !== false;
  const testid = options.testid || 'poll-toggle';
  const label = formatPollLabel(intervalMs);
  const pressed = on ? 'true' : 'false';
  const aria = on
    ? `Stop auto-refresh (${label})`
    : `Start auto-refresh (${label})`;
  const onClass = on ? ' poll-toggle--on' : '';
  return `
<span class="poll-toggle${onClass}" data-testid="${testid}">
  <button
    type="button"
    class="icon-btn"
    data-testid="${testid}-btn"
    aria-pressed="${pressed}"
    aria-label="${aria}"
    data-poll-ms="${intervalMs}"
  >
    <span class="icon" aria-hidden="true">${REFRESH_ICON}</span>
  </button>
  <span class="poll-toggle__label" data-testid="${testid}-label" aria-hidden="true">${label}</span>
</span>`.trim();
}

export type MountPollToggleOptions = {
  intervalMs?: number;
  defaultOn?: boolean;
  onTick?: () => void;
  testid?: string;
};

export function mountPollToggle(
  container: ParentNode,
  options: MountPollToggleOptions = {},
): () => void {
  const intervalMs = options.intervalMs ?? POLL_DEFAULT_MS;
  const testid = options.testid || 'poll-toggle';
  let on = options.defaultOn !== false;
  let timer: ReturnType<typeof setInterval> | null = null;

  if (container instanceof Element) {
    container.innerHTML = pollToggleMarkup({ intervalMs, on, testid });
  } else {
    const host = document.createElement('div');
    host.innerHTML = pollToggleMarkup({ intervalMs, on, testid });
    container.append(...Array.from(host.childNodes));
  }

  const root = container.querySelector('.poll-toggle');
  const btn = container.querySelector<HTMLButtonElement>(`[data-testid="${testid}-btn"]`);
  if (!root || !btn) {
    return () => {};
  }

  const label = formatPollLabel(intervalMs);

  function clearTimer() {
    if (timer != null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function sync() {
    root!.classList.toggle('poll-toggle--on', on);
    btn!.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn!.setAttribute(
      'aria-label',
      on ? `Stop auto-refresh (${label})` : `Start auto-refresh (${label})`,
    );
    clearTimer();
    if (on) {
      timer = setInterval(() => {
        options.onTick?.();
      }, intervalMs);
    }
  }

  function onClick(event: Event) {
    event.preventDefault();
    on = !on;
    sync();
    if (on) {
      options.onTick?.();
    }
  }

  btn.addEventListener('click', onClick);
  sync();

  return () => {
    btn.removeEventListener('click', onClick);
    clearTimer();
  };
}

export function mountHeaderPollToggle(
  options: MountPollToggleOptions & { slotSelector?: string } = {},
): () => void {
  const selector = options.slotSelector || '[data-testid="header-slot"]';
  const slot = document.querySelector(selector);
  if (!slot) {
    return () => {};
  }
  slot.replaceChildren();
  return mountPollToggle(slot, {
    intervalMs: options.intervalMs,
    defaultOn: options.defaultOn,
    onTick: options.onTick,
    testid: options.testid || 'header-poll-toggle',
  });
}

/** Wait for header mount, then bind poll toggle. */
export function whenHeaderReady(bind: () => () => void): () => void {
  let dispose: (() => void) | null = null;
  let observer: MutationObserver | null = null;

  const tryBind = () => {
    const slot = document.querySelector('[data-testid="header-slot"]');
    if (!slot) return false;
    dispose?.();
    dispose = bind();
    return true;
  };

  if (!tryBind()) {
    observer = new MutationObserver(() => {
      if (tryBind()) {
        observer?.disconnect();
        observer = null;
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  return () => {
    observer?.disconnect();
    dispose?.();
  };
}
