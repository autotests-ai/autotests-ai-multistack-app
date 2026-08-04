import type { AuthMessages } from './auth';

export const LOGIN_MESSAGES: AuthMessages = {
  errorBothRequired:
    'Login and password are required (minimum {minLogin} and {minPassword} characters)',
  errorLoginRequired: 'Login is required (minimum {minLogin} characters)',
  errorLoginMinLength: 'Login must be at least {minLogin} characters',
  errorPasswordRequired: 'Password is required (minimum {minPassword} characters)',
  errorPasswordMinLength: 'Password must be at least {minPassword} characters',
  errorWrongCredentials: 'Wrong login or password',
  errorNetwork: 'Network error. Check your connection and try again.',
};

export const REGISTER_MESSAGES: AuthMessages = {
  errorBothRequired:
    'Login and password are required (minimum {minLogin} and {minPassword} characters)',
  errorLoginRequired: 'Login is required (minimum {minLogin} characters)',
  errorLoginMinLength: 'Login must be at least {minLogin} characters',
  errorPasswordRequired: 'Password is required (minimum {minPassword} characters)',
  errorPasswordMinLength: 'Password must be at least {minPassword} characters',
  errorPasswordMismatch: 'Passwords do not match',
  errorNetwork: 'Network error. Check your connection and try again.',
  errorRegistrationFailed: 'Registration failed',
};
