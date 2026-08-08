<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from '../components/Button.vue';
import Panel from '../components/Panel.vue';
import { fetchHealth, fetchItems, type Item } from '../lib/api';
import { UI_MOUNT } from '../lib/appBase';
import { clearSession, deleteAccount, fetchProfile, getToken, logout } from '../lib/auth';
import { DELETE_ACCOUNT_CONFIRM } from '../lib/messages';

type HealthState = { text: string; error: boolean };
type ItemsState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'loaded'; items: Item[] }
  | { status: 'error'; message: string };

const router = useRouter();
const health = ref<HealthState>({ text: '→ Checking health…', error: false });
const items = ref<ItemsState>({ status: 'loading' });
const welcome = ref<string | null>(null);

let active = true;

onMounted(() => {
  active = true;

  fetchHealth()
    .then((payload) => {
      if (active) {
        health.value = {
          text: `→ ${payload.status} | service: ${payload.service} | frontend: ${UI_MOUNT}`,
          error: false,
        };
      }
    })
    .catch((error: Error) => {
      if (active) {
        health.value = { text: `✗ health: ${error.message}`, error: true };
      }
    });

  fetchItems()
    .then((payload) => {
      if (!active) return;
      const list = payload.items ?? [];
      items.value = list.length ? { status: 'loaded', items: list } : { status: 'empty' };
    })
    .catch((error: Error) => {
      if (active) {
        items.value = { status: 'error', message: error.message };
      }
    });

  if (getToken()) {
    fetchProfile()
      .then((profile) => {
        if (active) {
          welcome.value = `Welcome, ${profile.username}!`;
        }
      })
      .catch(() => {
        if (active) {
          clearSession();
        }
      });
  }
});

onUnmounted(() => {
  active = false;
});

async function handleLogout(): Promise<void> {
  await logout();
  await router.push('/login');
}

async function handleDeleteAccount(): Promise<void> {
  if (!window.confirm(DELETE_ACCOUNT_CONFIRM)) {
    return;
  }
  await deleteAccount();
  await router.push('/login');
}
</script>

<template>
  <main
    class="page-shell page-shell--below-header grid reference-app"
    data-testid="reference-layout"
  >
    <Panel title="Reference App">
      <p class="text text--muted">
        TypeScript Vue SPA — items loaded from <code>/api/items</code>.
      </p>
    </Panel>

    <Panel
      title="Session"
      test-id="welcome-panel"
      :hidden="welcome === null"
      body-class-name="reference-app__welcome-body"
    >
      <p id="welcome-message" class="text" data-testid="welcome-message">
        {{ welcome }}
      </p>
      <Button id="logout-button" variant="primary" data-testid="logout-button" @click="handleLogout">
        Logout
      </Button>
      <Button
        id="delete-account-button"
        variant="danger"
        data-testid="delete-account-button"
        @click="handleDeleteAccount"
      >
        Delete account
      </Button>
    </Panel>

    <Panel title="Health" test-id="health-panel">
      <p
        :class="
          health.error
            ? 'text text--sm text--muted reference-app__error'
            : 'text text--sm text--muted'
        "
        data-testid="health-status"
      >
        {{ health.text }}
      </p>
    </Panel>

    <div class="grid" data-testid="items-list" aria-live="polite">
      <Panel v-if="items.status === 'loading'" title="Items">
        <p class="text text--muted">→ Loading items…</p>
      </Panel>
      <Panel v-else-if="items.status === 'empty'" title="Items">
        <p class="text text--muted">No items found.</p>
      </Panel>
      <Panel v-else-if="items.status === 'error'" title="Items">
        <p class="reference-app__error">✗ items: {{ items.message }}</p>
      </Panel>
      <template v-else-if="items.status === 'loaded'">
        <Panel v-for="item in items.items" :key="item.id" :title="item.name" test-id="item-row">
          <p class="text text--muted">{{ item.description }}</p>
        </Panel>
      </template>
    </div>
  </main>
</template>
