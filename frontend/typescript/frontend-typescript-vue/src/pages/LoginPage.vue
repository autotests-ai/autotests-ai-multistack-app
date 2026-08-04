<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from '../components/Button.vue';
import Panel from '../components/Panel.vue';
import PlaqueField from '../components/PlaqueField.vue';
import { LOGIN_MESSAGES } from '../lib/messages';
import {
  getToken,
  login,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from '../lib/auth';

const router = useRouter();
const username = ref('');
const password = ref('');
const error = ref('');
const submitting = ref(false);

onMounted(() => {
  if (getToken()) {
    void router.replace('/');
  }
});

async function handleSubmit(event: Event): Promise<void> {
  event.preventDefault();
  error.value = '';

  const trimmedLogin = username.value.trim();
  const trimmedPassword = password.value.trim();
  const validationError = validateCredentials(trimmedLogin, trimmedPassword, LOGIN_MESSAGES);
  if (validationError) {
    error.value = validationError;
    return;
  }

  submitting.value = true;
  try {
    const response = await login(trimmedLogin, trimmedPassword);
    saveSession(response.token);
    await router.push(response.redirectUrl || '/');
  } catch (err) {
    error.value = resolveAuthErrorMessage(
      err,
      LOGIN_MESSAGES,
      LOGIN_MESSAGES.errorWrongCredentials ?? '',
    );
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="auth-page">
    <Panel
      title="Login Form"
      title-test-id="login-form-title"
      test-id="login-panel"
      class-name="auth-panel"
    >
      <form id="login-form" class="auth-form" data-testid="login-form" @submit="handleSubmit">
        <div class="plaque-field-list">
          <PlaqueField
            v-model="username"
            label="Login"
            id="login-input"
            type="text"
            autocomplete="username"
            data-testid="login-input"
          />
          <PlaqueField
            v-model="password"
            label="Password"
            id="password-input"
            type="password"
            autocomplete="current-password"
            data-testid="password-input"
          />
        </div>

        <p id="error-message" class="auth-error" aria-live="polite" data-testid="error-message">
          {{ error }}
        </p>

        <div class="auth-form__actions">
          <Button
            id="submit-button"
            type="submit"
            variant="primary"
            block
            data-testid="submit-button"
            :disabled="submitting"
          >
            Login
          </Button>
        </div>
      </form>

      <p class="auth-footer-link">
        No account?
        <RouterLink to="/register" data-testid="register-link">Register</RouterLink>
      </p>
    </Panel>
  </main>
</template>
