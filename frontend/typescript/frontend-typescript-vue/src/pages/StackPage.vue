<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import Panel from '../components/Panel.vue';
import { appPath } from '../lib/appBase';
import {
  mountHeaderPollToggle,
  whenHeaderReady,
} from '../../../../_shared/poll-toggle';
import {
  comboHref,
  componentTestsMeta,
  componentTestsPath,
  fetchStackMatrix,
  shortModuleLabel,
  findById,
  GITHUB_MARK_PATH,
  githubModuleHref,
  isOpenable,
  parseMount,
  parseTestsId,
  resolveTestsId,
  stackHref,
  summarizeMatrix,
  unitTestsMeta,
  unitTestsPath,
  type BackendModule,
  type FrontendModule,
  type StackMatrix,
  type TestsModule,
} from '../../../../_shared/stack-matrix';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; data: StackMatrix };

const mount = parseMount(window.location.pathname);
const requestedTests = parseTestsId(window.location.search);
const state = ref<LoadState>({ status: 'loading' });
const githubMarkPath = GITHUB_MARK_PATH;

let active = true;
let disposePoll: (() => void) | null = null;

function loadMatrix() {
  fetchStackMatrix(appPath('/stack/matrix.json'))
    .then((data) => {
      if (active) state.value = { status: 'loaded', data };
    })
    .catch((error: Error) => {
      if (active) state.value = { status: 'error', message: error.message };
    });
}

onMounted(() => {
  active = true;
  loadMatrix();
  disposePoll = whenHeaderReady(() =>
    mountHeaderPollToggle({
      defaultOn: true,
      onTick: () => loadMatrix(),
    }),
  );
});

onUnmounted(() => {
  active = false;
  disposePoll?.();
  disposePoll = null;
});

const summary = computed(() =>
  state.value.status === 'loaded' ? summarizeMatrix(state.value.data) : null,
);

const currentTests = computed(() =>
  state.value.status === 'loaded'
    ? resolveTestsId(state.value.data, requestedTests)
    : null,
);

const backend = computed(() =>
  summary.value ? findById(summary.value.backends, mount.backendId) : null,
);

const frontend = computed(() =>
  summary.value ? findById(summary.value.frontends, mount.frontendId) : null,
);

const unitPath = computed(() => unitTestsPath(backend.value));
const componentPath = computed(() => componentTestsPath(frontend.value));

const unitMeta = computed(() => unitTestsMeta(backend.value));
const unitLabel = computed(() => shortModuleLabel(unitPath.value) || 'unit');

const componentMeta = computed(() => componentTestsMeta(componentPath.value));
const componentLabel = computed(
  () => shortModuleLabel(componentPath.value) || 'component',
);

const label = computed(() => {
  const parts: string[] = [];
  if (mount.backendId && mount.frontendId) {
    parts.push(`${mount.backendId} · ${mount.frontendId}`);
  } else if (mount.frontendId) {
    parts.push(`(no backend prefix) · ${mount.frontendId}`);
  } else {
    parts.push('path without /{backend}/{frontend}/');
  }
  if (currentTests.value) parts.push(currentTests.value);
  return parts.join(' · ');
});

const homeHref = comboHref(mount.backendId, mount.frontendId, '/');

function metaFor(kind: 'backend' | 'frontend', item: BackendModule | FrontendModule): string {
  const status = item.status || 'active';
  return kind === 'backend'
    ? `${(item as BackendModule).language || 'backend'} · ${status}`
    : `${(item as FrontendModule).kind || 'frontend'} · ${status}`;
}

function testsMeta(item: TestsModule): string {
  const status = item.status || 'active';
  return `${item.language || 'tests'} · ${status}`;
}

function layersLabel(layers?: string[]): string {
  return (layers || []).join(' · ');
}

function rowOpenable(kind: 'backend' | 'frontend', item: BackendModule | FrontendModule): boolean {
  const targetBackend = kind === 'backend' ? item.id : mount.backendId;
  const targetFrontend = kind === 'frontend' ? item.id : mount.frontendId;
  return isOpenable(item.status) && Boolean(targetBackend && targetFrontend);
}

function rowHref(kind: 'backend' | 'frontend', item: BackendModule | FrontendModule): string {
  const targetBackend = kind === 'backend' ? item.id : mount.backendId;
  const targetFrontend = kind === 'frontend' ? item.id : mount.frontendId;
  return stackHref(targetBackend, targetFrontend, currentTests.value);
}

function testsHref(item: TestsModule): string {
  return stackHref(mount.backendId, mount.frontendId, item.id);
}

function testsSelectable(item: TestsModule): boolean {
  return isOpenable(item.status) && Boolean(mount.backendId && mount.frontendId);
}

function moduleGh(modulePath?: string | null): string | null {
  return githubModuleHref(modulePath);
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

    <template v-if="summary">
      <div class="stack-page__boards">
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
                    v-if="moduleGh(item.module)"
                    class="icon-btn stack-page__gh-icon"
                    :href="moduleGh(item.module)!"
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
                    v-if="moduleGh(item.module)"
                    class="icon-btn stack-page__gh-icon"
                    :href="moduleGh(item.module)!"
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

      <Panel
        title="Tests"
        body-class-name="stack-page__board-body"
        class-name="stack-page__board stack-page__board--tests"
        test-id="stack-tests-board"
      >
        <table class="stack-page__table stack-page__table--tests">
          <thead>
            <tr>
              <th>Module</th>
              <th>Layers</th>
              <th class="stack-page__gh-cell">GH</th>
              <th>Status</th>
              <th>Select</th>
            </tr>
          </thead>
          <tbody>
            <tr :class="{ 'stack-page__row--active': Boolean(mount.backendId) }">
              <td>
                <a
                  v-if="moduleGh(unitPath)"
                  class="link stack-page__id"
                  :class="{ 'is-active': Boolean(mount.backendId) }"
                  :href="moduleGh(unitPath)!"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="stack-tests-unit"
                >
                  {{ unitLabel }}
                </a>
                <span
                  v-else
                  class="stack-page__id stack-page__id--disabled"
                  :class="{ 'is-active': Boolean(mount.backendId) }"
                  data-testid="stack-tests-unit"
                >
                  {{ unitLabel }}
                </span>
                <div class="text text--sm text--muted stack-page__meta">{{ unitMeta }}</div>
              </td>
              <td class="stack-page__layers-cell">
                <span class="stack-page__layers" data-testid="stack-tests-layers">unit</span>
              </td>
              <td class="stack-page__gh-cell">
                <a
                  v-if="moduleGh(unitPath)"
                  class="icon-btn stack-page__gh-icon"
                  :href="moduleGh(unitPath)!"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub unit"
                  :title="unitPath || undefined"
                  data-testid="stack-gh-tests-unit"
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
                <span class="badge">{{ unitPath ? 'derived' : 'slot' }}</span>
              </td>
              <td><span class="text text--sm text--muted">—</span></td>
            </tr>

            <tr :class="{ 'stack-page__row--active': Boolean(mount.frontendId) }">
              <td>
                <a
                  v-if="moduleGh(componentPath)"
                  class="link stack-page__id"
                  :class="{ 'is-active': Boolean(mount.frontendId) }"
                  :href="moduleGh(componentPath)!"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="stack-tests-component"
                >
                  {{ componentLabel }}
                </a>
                <span
                  v-else
                  class="stack-page__id stack-page__id--disabled"
                  :class="{ 'is-active': Boolean(mount.frontendId) }"
                  data-testid="stack-tests-component"
                >
                  {{ componentLabel }}
                </span>
                <div class="text text--sm text--muted stack-page__meta">{{ componentMeta }}</div>
              </td>
              <td class="stack-page__layers-cell">
                <span class="stack-page__layers" data-testid="stack-tests-layers">component</span>
              </td>
              <td class="stack-page__gh-cell">
                <a
                  v-if="moduleGh(componentPath)"
                  class="icon-btn stack-page__gh-icon"
                  :href="moduleGh(componentPath)!"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub component"
                  :title="componentPath || undefined"
                  data-testid="stack-gh-tests-component"
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
                <span class="badge">{{ componentPath ? 'derived' : 'slot' }}</span>
              </td>
              <td><span class="text text--sm text--muted">—</span></td>
            </tr>

            <tr
              v-for="item in summary.tests"
              :key="item.id"
              :class="{ 'stack-page__row--active': item.id === currentTests }"
            >
              <td>
                <a
                  v-if="testsSelectable(item)"
                  class="link stack-page__id"
                  :class="{ 'is-active': item.id === currentTests }"
                  :href="testsHref(item)"
                  :data-testid="`stack-tests-${item.id}`"
                >
                  {{ item.id }}
                </a>
                <span
                  v-else
                  class="stack-page__id stack-page__id--disabled"
                  :class="{ 'is-active': item.id === currentTests }"
                  :data-testid="`stack-tests-${item.id}`"
                >
                  {{ item.id }}
                </span>
                <div class="text text--sm text--muted stack-page__meta">
                  {{ testsMeta(item) }}
                </div>
              </td>
              <td class="stack-page__layers-cell">
                <span
                  v-if="layersLabel(item.layers)"
                  class="stack-page__layers"
                  data-testid="stack-tests-layers"
                >
                  {{ layersLabel(item.layers) }}
                </span>
                <span v-else class="text text--sm text--muted">—</span>
              </td>
              <td class="stack-page__gh-cell">
                <a
                  v-if="moduleGh(item.module)"
                  class="icon-btn stack-page__gh-icon"
                  :href="moduleGh(item.module)!"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="`GitHub ${item.id}`"
                  :title="item.module"
                  :data-testid="`stack-gh-tests-${item.id}`"
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
                  v-if="testsSelectable(item)"
                  class="link stack-page__open"
                  :class="{ 'is-active': item.id === currentTests }"
                  :href="testsHref(item)"
                >
                  select →
                </a>
                <span v-else class="text text--sm text--muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </Panel>
    </template>
  </main>
</template>
