<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import Panel from '../components/Panel.vue';
import { appPath } from '../lib/appBase';
import {
  comboHref,
  fetchStackMatrix,
  GITHUB_MARK_PATH,
  githubModuleHref,
  isOpenable,
  parseMount,
  stackHref,
  summarizeMatrix,
  type BackendModule,
  type FrontendModule,
  type StackMatrix,
} from '../../../../_shared/stack-matrix';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; data: StackMatrix };

const mount = parseMount(window.location.pathname);
const state = ref<LoadState>({ status: 'loading' });
const githubMarkPath = GITHUB_MARK_PATH;

let active = true;

onMounted(() => {
  active = true;
  fetchStackMatrix(appPath('/stack/matrix.json'))
    .then((data) => {
      if (active) state.value = { status: 'loaded', data };
    })
    .catch((error: Error) => {
      if (active) state.value = { status: 'error', message: error.message };
    });
});

onUnmounted(() => {
  active = false;
});

const summary = computed(() =>
  state.value.status === 'loaded' ? summarizeMatrix(state.value.data) : null,
);

const label =
  mount.backendId && mount.frontendId
    ? `${mount.backendId} · ${mount.frontendId}`
    : mount.frontendId
      ? `(no backend prefix) · ${mount.frontendId}`
      : 'path without /{backend}/{frontend}/';

const homeHref = comboHref(mount.backendId, mount.frontendId, '/');

function metaFor(kind: 'backend' | 'frontend', item: BackendModule | FrontendModule): string {
  const status = item.status || 'active';
  return kind === 'backend'
    ? `${(item as BackendModule).language || 'backend'} · ${status}`
    : `${(item as FrontendModule).kind || 'frontend'} · ${status}`;
}

function rowOpenable(kind: 'backend' | 'frontend', item: BackendModule | FrontendModule): boolean {
  const targetBackend = kind === 'backend' ? item.id : mount.backendId;
  const targetFrontend = kind === 'frontend' ? item.id : mount.frontendId;
  return isOpenable(item.status) && Boolean(targetBackend && targetFrontend);
}

function rowHref(kind: 'backend' | 'frontend', item: BackendModule | FrontendModule): string {
  const targetBackend = kind === 'backend' ? item.id : mount.backendId;
  const targetFrontend = kind === 'frontend' ? item.id : mount.frontendId;
  return stackHref(targetBackend, targetFrontend);
}

function moduleGh(item: BackendModule | FrontendModule): string | null {
  return githubModuleHref(item.module);
}
</script>

<template>
  <main class="page-shell page-shell--below-header stack-page" data-testid="stack-page">
    <div class="stack-page__header">
      <a
        class="badge badge--primary stack-page__current"
        :href="homeHref"
        title="open app home"
        data-testid="stack-current-pair"
      >
        {{ label }}
      </a>
    </div>

    <div v-if="state.status === 'error'" class="stack-page__error" data-testid="stack-error">
      Не удалось загрузить matrix.json — sync: python frontend/scripts/sync-stack-matrix.py.
      {{ state.message }}
    </div>

    <p v-if="state.status === 'loading'" class="text text--muted" data-testid="stack-loading">
      → Loading matrix…
    </p>

    <div v-if="summary" class="stack-page__boards">
      <Panel title="Backend" body-class-name="stack-page__board-body" class-name="stack-page__board">
        <table class="stack-page__table">
          <thead>
            <tr>
              <th>Module</th>
              <th class="stack-page__gh-cell">GH</th>
              <th>Status</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in summary.backends"
              :key="item.id"
              :class="{ 'stack-page__row--active': item.id === mount.backendId }"
            >
              <td>
                <a
                  v-if="rowOpenable('backend', item)"
                  class="link stack-page__id"
                  :class="{ 'is-active': item.id === mount.backendId }"
                  :href="rowHref('backend', item)"
                  :data-testid="`stack-backend-${item.id}`"
                >
                  {{ item.id }}
                </a>
                <span
                  v-else
                  class="stack-page__id stack-page__id--disabled"
                  :class="{ 'is-active': item.id === mount.backendId }"
                  :data-testid="`stack-backend-${item.id}`"
                >
                  {{ item.id }}
                </span>
                <div class="text text--sm text--muted stack-page__meta">
                  {{ metaFor('backend', item) }}
                </div>
              </td>
              <td class="stack-page__gh-cell">
                <a
                  v-if="moduleGh(item)"
                  class="icon-btn stack-page__gh-icon"
                  :href="moduleGh(item)!"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="`GitHub ${item.id}`"
                  :title="item.module"
                  :data-testid="`stack-gh-backend-${item.id}`"
                >
                  <span class="icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path :d="githubMarkPath" />
                    </svg>
                  </span>
                </a>
                <span v-else class="text text--sm text--muted">—</span>
              </td>
              <td>
                <span
                  class="badge"
                  :class="{ 'badge--primary': (item.status || 'active') === 'active' }"
                >
                  {{ item.status || 'active' }}
                </span>
              </td>
              <td>
                <a
                  v-if="rowOpenable('backend', item)"
                  class="link stack-page__open"
                  :class="{ 'is-active': item.id === mount.backendId }"
                  :href="rowHref('backend', item)"
                >
                  open →
                </a>
                <span v-else class="text text--sm text--muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </Panel>

      <Panel title="Frontend" body-class-name="stack-page__board-body" class-name="stack-page__board">
        <table class="stack-page__table">
          <thead>
            <tr>
              <th>Module</th>
              <th class="stack-page__gh-cell">GH</th>
              <th>Status</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in summary.frontends"
              :key="item.id"
              :class="{ 'stack-page__row--active': item.id === mount.frontendId }"
            >
              <td>
                <a
                  v-if="rowOpenable('frontend', item)"
                  class="link stack-page__id"
                  :class="{ 'is-active': item.id === mount.frontendId }"
                  :href="rowHref('frontend', item)"
                  :data-testid="`stack-frontend-${item.id}`"
                >
                  {{ item.id }}
                </a>
                <span
                  v-else
                  class="stack-page__id stack-page__id--disabled"
                  :class="{ 'is-active': item.id === mount.frontendId }"
                  :data-testid="`stack-frontend-${item.id}`"
                >
                  {{ item.id }}
                </span>
                <div class="text text--sm text--muted stack-page__meta">
                  {{ metaFor('frontend', item) }}
                </div>
              </td>
              <td class="stack-page__gh-cell">
                <a
                  v-if="moduleGh(item)"
                  class="icon-btn stack-page__gh-icon"
                  :href="moduleGh(item)!"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="`GitHub ${item.id}`"
                  :title="item.module"
                  :data-testid="`stack-gh-frontend-${item.id}`"
                >
                  <span class="icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path :d="githubMarkPath" />
                    </svg>
                  </span>
                </a>
                <span v-else class="text text--sm text--muted">—</span>
              </td>
              <td>
                <span
                  class="badge"
                  :class="{ 'badge--primary': (item.status || 'active') === 'active' }"
                >
                  {{ item.status || 'active' }}
                </span>
              </td>
              <td>
                <a
                  v-if="rowOpenable('frontend', item)"
                  class="link stack-page__open"
                  :class="{ 'is-active': item.id === mount.frontendId }"
                  :href="rowHref('frontend', item)"
                >
                  open →
                </a>
                <span v-else class="text text--sm text--muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </Panel>
    </div>

    <p class="text text--sm text--muted stack-page__foot">
      matrix.json ← deploy/matrix.yaml · click active → /{backend}/{frontend}/stack/
    </p>
  </main>
</template>
