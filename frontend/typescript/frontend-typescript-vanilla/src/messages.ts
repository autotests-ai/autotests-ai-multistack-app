import type { AuthMessages } from './auth';
import { en } from './i18n';

export const LOGIN_MESSAGES: AuthMessages = {
  ...en.auth,
  errorWrongCredentials: en.login.errorWrongCredentials,
};

export const REGISTER_MESSAGES: AuthMessages = {
  ...en.auth,
  errorPasswordMismatch: en.register.errorPasswordMismatch,
  errorRegistrationFailed: en.register.errorRegistrationFailed,
};

export const DELETE_ACCOUNT_CONFIRM = en.home.deleteConfirm;
