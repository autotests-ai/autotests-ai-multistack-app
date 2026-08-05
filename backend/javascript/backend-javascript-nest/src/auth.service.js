'use strict';

const { Injectable } = require('@nestjs/common');

const { ApiException, DuplicateUsernameError } = require('./errors');
const { hashPassword, checkPassword } = require('./passwords');
const { validateCredentials } = require('./validation');
const { injectConstructor } = require('./di');
const { JwtService } = require('./jwt.service');
const { STORE, SETTINGS } = require('./tokens');

@Injectable()
class AuthService {
  constructor(store, jwt, settings) {
    this.store = store;
    this.jwt = jwt;
    this.postAuthRedirect = settings.postAuthRedirect;
  }

  authResponse(username) {
    return {
      token: this.jwt.createToken(username),
      username,
      redirectUrl: this.postAuthRedirect,
    };
  }

  credentialsOrThrow(body) {
    const source = body && typeof body === 'object' ? body : {};
    const error = validateCredentials(source.username, source.password);
    if (error) {
      throw new ApiException(400, error);
    }
    return { username: source.username, password: source.password };
  }

  async register(body) {
    const { username, password } = this.credentialsOrThrow(body);
    if (await this.store.findUserByUsername(username)) {
      throw new ApiException(409, 'Username already taken');
    }
    try {
      await this.store.insertUser(username, hashPassword(password));
    } catch (error) {
      // A concurrent insert that won the race surfaces as the unique violation.
      if (error instanceof DuplicateUsernameError) {
        throw new ApiException(409, 'Username already taken');
      }
      throw error;
    }
    return this.authResponse(username);
  }

  async login(body) {
    const { username, password } = this.credentialsOrThrow(body);
    const user = await this.store.findUserByUsername(username);
    if (user === null || !checkPassword(password, user.passwordHash)) {
      throw new ApiException(401, 'Wrong login or password');
    }
    return this.authResponse(username);
  }

  /** Resolves the bearer token to a username that still exists, or throws 401. */
  async profile(authorizationHeader) {
    const header =
      typeof authorizationHeader === 'string' ? authorizationHeader : '';
    if (!header.startsWith('Bearer ')) {
      throw new ApiException(401, 'Unauthorized');
    }
    const username = this.jwt.extractUsername(header.slice('Bearer '.length));
    if (!username) {
      throw new ApiException(401, 'Unauthorized');
    }
    if ((await this.store.findUserByUsername(username)) === null) {
      throw new ApiException(401, 'Unauthorized');
    }
    return { username };
  }
}

injectConstructor(AuthService, STORE, JwtService, SETTINGS);

module.exports = { AuthService };
