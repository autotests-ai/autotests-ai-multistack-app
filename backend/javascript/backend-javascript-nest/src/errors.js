'use strict';

const { HttpException } = require('@nestjs/common');

/** Raised by a store when the users.username unique constraint fires (lost race). */
class DuplicateUsernameError extends Error {
  constructor(username) {
    super(`username already exists: ${username}`);
    this.name = 'DuplicateUsernameError';
  }
}

/** HttpException whose body is exactly the contract's `{"message": "..."}`. */
class ApiException extends HttpException {
  constructor(status, message) {
    super({ message }, status);
  }
}

const UNIQUE_VIOLATION = '23505';

module.exports = { DuplicateUsernameError, ApiException, UNIQUE_VIOLATION };
