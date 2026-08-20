import type { AuthMessages } from './auth';

const AUTH_BASE_MESSAGES: AuthMessages = {
  errorBothRequired:
    'Login and password are required (minimum {minLogin} and {minPassword} characters)',
  errorLoginRequired: 'Login is required (minimum {minLogin} characters)',
  errorLoginMinLength: 'Login must be at least {minLogin} characters',
  errorPasswordRequired: 'Password is required (minimum {minPassword} characters)',
  errorPasswordMinLength: 'Password must be at least {minPassword} characters',
  errorNetwork: 'Network error. Check your connection and try again.',
};

export const LOGIN_MESSAGES: AuthMessages = {
  ...AUTH_BASE_MESSAGES,
  errorWrongCredentials: 'Wrong login or password',
};

export const REGISTER_MESSAGES: AuthMessages = {
  ...AUTH_BASE_MESSAGES,
  errorPasswordMismatch: 'Passwords do not match',
  errorRegistrationFailed: 'Registration failed',
};

export const DELETE_ACCOUNT_CONFIRM = 'Delete this account? This cannot be undone.';

export const NOTE_MESSAGES = {
  errorTextRequired: 'Text is required',
  errorSaveFailed: 'Could not save the note',
  errorDeleteFailed: 'Could not delete the note',
};
