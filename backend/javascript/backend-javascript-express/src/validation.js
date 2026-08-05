'use strict';

const USERNAME_MIN = 3;
const USERNAME_MAX = 64;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 128;

/** Returns the contract error message, or null when the credentials are valid. */
function validateCredentials(username, password) {
  if (typeof username !== 'string' || username.length === 0) {
    return 'username is required';
  }
  if (typeof password !== 'string' || password.length === 0) {
    return 'password is required';
  }
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return 'username must be 3-64 characters';
  }
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return 'password must be 6-128 characters';
  }
  return null;
}

module.exports = {
  validateCredentials,
  USERNAME_MIN,
  USERNAME_MAX,
  PASSWORD_MIN,
  PASSWORD_MAX,
};
