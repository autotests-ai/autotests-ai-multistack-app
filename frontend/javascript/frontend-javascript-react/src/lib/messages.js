/** @typedef {import('./auth').AuthMessages} AuthMessages */

/** @type {AuthMessages} */
const AUTH_BASE_MESSAGES = {
  errorBothRequired:
    'Login and password are required (minimum {minLogin} and {minPassword} characters)',
  errorLoginRequired: 'Login is required (minimum {minLogin} characters)',
  errorLoginMinLength: 'Login must be at least {minLogin} characters',
  errorPasswordRequired: 'Password is required (minimum {minPassword} characters)',
  errorPasswordMinLength: 'Password must be at least {minPassword} characters',
  errorNetwork: 'Network error. Check your connection and try again.',
};

/** @type {AuthMessages} */
export const LOGIN_MESSAGES = {
  ...AUTH_BASE_MESSAGES,
  errorWrongCredentials: 'Wrong login or password',
};

/** @type {AuthMessages} */
export const REGISTER_MESSAGES = {
  ...AUTH_BASE_MESSAGES,
  errorPasswordMismatch: 'Passwords do not match',
  errorRegistrationFailed: 'Registration failed',
};

export const DELETE_ACCOUNT_CONFIRM = 'Delete this account? This cannot be undone.';
