'use strict';

const { Injectable } = require('@nestjs/common');
const jsonwebtoken = require('jsonwebtoken');

const { injectConstructor } = require('./di');
const { SETTINGS } = require('./tokens');

@Injectable()
class JwtService {
  constructor(settings) {
    this.secret = settings.jwtSecret;
    this.expirationMs = settings.jwtExpirationMs;
  }

  createToken(username) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    return jsonwebtoken.sign(
      {
        sub: username,
        iat: nowSeconds,
        exp: nowSeconds + Math.floor(this.expirationMs / 1000),
      },
      this.secret,
      { algorithm: 'HS256' }
    );
  }

  /** Returns the `sub` claim of a valid token, or null for any invalid/expired token. */
  extractUsername(token) {
    if (typeof token !== 'string' || token.length === 0) {
      return null;
    }
    try {
      const payload = jsonwebtoken.verify(token, this.secret, {
        algorithms: ['HS256'],
      });
      return typeof payload.sub === 'string' && payload.sub.length > 0
        ? payload.sub
        : null;
    } catch {
      return null;
    }
  }
}

injectConstructor(JwtService, SETTINGS);

module.exports = { JwtService };
