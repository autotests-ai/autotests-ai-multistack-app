import { apiUrl, authTokenStorageKey } from './app-base.js';

/** Backend-scoped localStorage key — see `authTokenStorageKey`. */
export const AUTH_TOKEN_KEY = authTokenStorageKey();
export const MIN_LOGIN_LENGTH = 3;
export const MIN_PASSWORD_LENGTH = 6;

/**
 * @typedef {{
 *   errorBothRequired: string,
 *   errorLoginRequired: string,
 *   errorLoginMinLength: string,
 *   errorPasswordRequired: string,
 *   errorPasswordMinLength: string,
 *   errorNetwork: string,
 *   errorPasswordMismatch?: string,
 *   errorWrongCredentials?: string,
 *   errorRegistrationFailed?: string,
 * }} AuthMessages
 * @typedef {{ token: string, username: string, redirectUrl?: string }} AuthResponse
 * @typedef {{ username: string }} UserProfile
 */

function readLocalStorage(name) {
  try {
    return localStorage.getItem(name);
  } catch {
    return null;
  }
}

function writeLocalStorage(name, value) {
  try {
    localStorage.setItem(name, value);
  } catch {
    /* ignore quota / disabled storage */
  }
}

function removeFromLocalStorage(name) {
  try {
    localStorage.removeItem(name);
  } catch {
    /* ignore */
  }
}

export function formatMessage(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    values[key] !== undefined ? String(values[key]) : '',
  );
}

export function validateCredentials(login, password, messages) {
  if (!login && !password) {
    return formatMessage(messages.errorBothRequired, {
      minLogin: MIN_LOGIN_LENGTH,
      minPassword: MIN_PASSWORD_LENGTH,
    });
  }
  if (!login) {
    return formatMessage(messages.errorLoginRequired, { minLogin: MIN_LOGIN_LENGTH });
  }
  if (login.length < MIN_LOGIN_LENGTH) {
    return formatMessage(messages.errorLoginMinLength, { minLogin: MIN_LOGIN_LENGTH });
  }
  if (!password) {
    return formatMessage(messages.errorPasswordRequired, { minPassword: MIN_PASSWORD_LENGTH });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return formatMessage(messages.errorPasswordMinLength, { minPassword: MIN_PASSWORD_LENGTH });
  }
  return null;
}

function createNetworkError() {
  const error = new Error('');
  error.network = true;
  return error;
}

export function resolveAuthErrorMessage(error, messages, fallbackMessage) {
  if (error?.network) {
    return messages.errorNetwork;
  }
  if (error?.message) {
    return error.message;
  }
  return fallbackMessage;
}

async function apiRequest(path, options) {
  let response;
  try {
    response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
    });
  } catch {
    throw createNetworkError();
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body.message === 'string' ? body.message : 'Request failed';
    throw new Error(message);
  }
  return body;
}

/** @returns {Promise<AuthResponse>} */
export function login(username, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

/** @returns {Promise<AuthResponse>} */
export function register(username, password) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

/** @returns {Promise<UserProfile>} */
export function fetchProfile() {
  const token = readLocalStorage(AUTH_TOKEN_KEY);
  if (!token) {
    throw new Error('Missing auth token');
  }
  return apiRequest('/auth/me', {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
  });
}

export async function logout() {
  const token = readLocalStorage(AUTH_TOKEN_KEY);
  if (token) {
    await fetch(apiUrl('/auth/logout'), {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
    }).catch(() => {});
  }
  removeFromLocalStorage(AUTH_TOKEN_KEY);
}

// Account deletion, not logout: the row is gone server-side and the token stops
// verifying. Local cleanup follows logout's policy — the session is dropped even
// when the call fails, so a dead token can never keep the UI signed in.
export async function deleteAccount() {
  const token = readLocalStorage(AUTH_TOKEN_KEY);
  if (token) {
    await fetch(apiUrl('/auth/me'), {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token },
    }).catch(() => {});
  }
  removeFromLocalStorage(AUTH_TOKEN_KEY);
}

export function saveSession(token) {
  writeLocalStorage(AUTH_TOKEN_KEY, token);
}

export function getToken() {
  return readLocalStorage(AUTH_TOKEN_KEY);
}

export function clearSession() {
  removeFromLocalStorage(AUTH_TOKEN_KEY);
}
