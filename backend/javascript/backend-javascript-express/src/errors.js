'use strict';

/** Raised by a store when the users.username unique constraint fires (lost race). */
class DuplicateUsernameError extends Error {
  constructor(username) {
    super(`username already exists: ${username}`);
    this.name = 'DuplicateUsernameError';
  }
}

/** Carries an HTTP status plus the contract `{"message": "..."}` payload. */
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const UNIQUE_VIOLATION = '23505';

module.exports = { DuplicateUsernameError, ApiError, UNIQUE_VIOLATION };
