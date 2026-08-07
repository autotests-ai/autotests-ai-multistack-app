'use strict';

const USERNAME_MIN = 3;
const USERNAME_MAX = 64;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 128;

/** The reference collects every field error into one message joined by this. */
const FIELD_SEPARATOR = '; ';

/** Arrays and scalars parse as JSON but are not a request body object. */
function isJsonObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Returns every failing field joined into one message, or null when the
 * credentials are valid. One failing field yields that field's message alone.
 */
function validateCredentials(username, password) {
  const errors = [];
  if (typeof username !== 'string' || username.length === 0) {
    errors.push('username is required');
  } else if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    errors.push('username must be 3-64 characters');
  }
  if (typeof password !== 'string' || password.length === 0) {
    errors.push('password is required');
  } else if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    errors.push('password must be 6-128 characters');
  }
  return errors.length === 0 ? null : errors.join(FIELD_SEPARATOR);
}

module.exports = {
  validateCredentials,
  isJsonObject,
  FIELD_SEPARATOR,
  USERNAME_MIN,
  USERNAME_MAX,
  PASSWORD_MIN,
  PASSWORD_MAX,
};
