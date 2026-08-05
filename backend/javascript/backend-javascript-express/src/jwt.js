'use strict';

const jwt = require('jsonwebtoken');

function createJwt(options) {
  const { jwtSecret, jwtExpirationMs } = options;

  function createToken(username) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    return jwt.sign(
      {
        sub: username,
        iat: nowSeconds,
        exp: nowSeconds + Math.floor(jwtExpirationMs / 1000),
      },
      jwtSecret,
      { algorithm: 'HS256' }
    );
  }

  /** Returns the `sub` claim of a valid token, or null for any invalid/expired token. */
  function extractUsername(token) {
    if (typeof token !== 'string' || token.length === 0) {
      return null;
    }
    try {
      const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      return typeof payload.sub === 'string' && payload.sub.length > 0
        ? payload.sub
        : null;
    } catch {
      return null;
    }
  }

  return { createToken, extractUsername };
}

module.exports = { createJwt };
