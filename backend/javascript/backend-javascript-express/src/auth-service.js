'use strict';

const { ApiError, DuplicateUsernameError } = require('./errors');
const { hashPassword, checkPassword } = require('./passwords');
const { validateCredentials } = require('./validation');

/**
 * Contract logic for /api/auth/**, independent of Express so it can be unit
 * tested against a fake store.
 */
function createAuthService({ store, jwt, postAuthRedirect = '/' }) {
  function authResponse(username) {
    return {
      token: jwt.createToken(username),
      username,
      redirectUrl: postAuthRedirect,
    };
  }

  function credentialsOrThrow(body) {
    const source = body && typeof body === 'object' ? body : {};
    const error = validateCredentials(source.username, source.password);
    if (error) {
      throw new ApiError(400, error);
    }
    return { username: source.username, password: source.password };
  }

  async function register(body) {
    const { username, password } = credentialsOrThrow(body);
    if (await store.findUserByUsername(username)) {
      throw new ApiError(409, 'Username already taken');
    }
    try {
      await store.insertUser(username, hashPassword(password));
    } catch (error) {
      // A concurrent insert that won the race surfaces as the unique violation.
      if (error instanceof DuplicateUsernameError) {
        throw new ApiError(409, 'Username already taken');
      }
      throw error;
    }
    return authResponse(username);
  }

  async function login(body) {
    const { username, password } = credentialsOrThrow(body);
    const user = await store.findUserByUsername(username);
    if (user === null || !checkPassword(password, user.passwordHash)) {
      throw new ApiError(401, 'Wrong login or password');
    }
    return authResponse(username);
  }

  /** Resolves the bearer token to a username that still exists, or throws 401. */
  async function profile(authorizationHeader) {
    const header =
      typeof authorizationHeader === 'string' ? authorizationHeader : '';
    if (!header.startsWith('Bearer ')) {
      throw new ApiError(401, 'Unauthorized');
    }
    const username = jwt.extractUsername(header.slice('Bearer '.length));
    if (!username) {
      throw new ApiError(401, 'Unauthorized');
    }
    if ((await store.findUserByUsername(username)) === null) {
      throw new ApiError(401, 'Unauthorized');
    }
    return { username };
  }

  return { register, login, profile };
}

module.exports = { createAuthService };
