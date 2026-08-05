<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from '../components/Button.vue';
import Panel from '../components/Panel.vue';
import PlaqueField from '../components/PlaqueField.vue';
import { REGISTER_MESSAGES } from '../lib/messages';
import {
  getToken,
  register,
  resolveAuthErrorMessage,
  saveSession,
  validateCredentials,
} from '../lib/auth';

const router = useRouter();
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
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
  const trimmedConfirm = confirmPassword.value.trim();

  const validationError = validateCredentials(trimmedLogin, trimmedPassword, REGISTER_MESSAGES);
  if (validationError) {
    error.value = validationError;
    return;
  }
  if (trimmedPassword !== trimmedConfirm) {
    error.value = REGISTER_MESSAGES.errorPasswordMismatch ?? '';
    return;
  }

  submitting.value = true;
  try {
    const response = await register(trimmedLogin, trimmedPassword);
    saveSession(response.token);
    await router.push(response.redirectUrl || '/');
  } catch (err) {
    error.value = resolveAuthErrorMessage(
      err,
      REGISTER_MESSAGES,
      REGISTER_MESSAGES.errorRegistrationFailed ?? '',
    );
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="auth-page">
    <Panel
      title="Register"
      title-test-id="register-form-title"
      test-id="register-panel"
      class-name="auth-panel"
    >
      <form
        id="register-form"
        class="auth-form"
        data-testid="register-form"
        @submit="handleSubmit"
      >
        <div class="plaque-field-list">
          <PlaqueField
            v-model="username"
            label="Login"
            id="login-input"
            name="username"
            type="text"
            autocomplete="username"
            data-testid="login-input"
          />
          <PlaqueField
            v-model="password"
            label="Password"
            id="password-input"
            name="password"
            type="password"
            autocomplete="new-password"
            data-testid="password-input"
          />
          <PlaqueField
            v-model="confirmPassword"
            label="Confirm"
            id="confirm-password-input"
            name="confirm-password"
            type="password"
            autocomplete="new-password"
            data-testid="confirm-password-input"
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
            Register
          </Button>
        </div>
      </form>

      <p class="auth-footer-link">
        Already have an account?
        <RouterLink to="/login" data-testid="login-link">Login</RouterLink>
      </p>
    </Panel>
  </main>
</template>
