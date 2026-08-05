'use strict';

const jsonwebtoken = require('jsonwebtoken');

const { createJwt } = require('../src/jwt');

const SETTINGS = { jwtSecret: 'test-secret-value', jwtExpirationMs: 86400000 };

describe('createJwt', () => {
  const jwt = createJwt(SETTINGS);

  it('signs HS256 with sub, iat and exp = iat + expiration', () => {
    const token = jwt.createToken('user1');
    const decoded = jsonwebtoken.decode(token, { complete: true });

    expect(decoded.header.alg).toBe('HS256');
    expect(decoded.payload.sub).toBe('user1');
    expect(typeof decoded.payload.iat).toBe('number');
    expect(decoded.payload.exp - decoded.payload.iat).toBe(86400);
  });

  it('round-trips the username of a freshly created token', () => {
    expect(jwt.extractUsername(jwt.createToken('alice'))).toBe('alice');
  });

  it.each([undefined, null, '', 'not-a-jwt', 'a.b.c'])(
    'returns null for the malformed token %p',
    (token) => {
      expect(jwt.extractUsername(token)).toBeNull();
    }
  );

  it('returns null for a token signed with another secret', () => {
    const foreign = createJwt({ ...SETTINGS, jwtSecret: 'other-secret' });
    expect(jwt.extractUsername(foreign.createToken('user1'))).toBeNull();
  });

  it('returns null for an expired token', () => {
    const expired = jsonwebtoken.sign({ sub: 'user1' }, SETTINGS.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: -60,
    });
    expect(jwt.extractUsername(expired)).toBeNull();
  });

  it('returns null when the sub claim is missing or not a string', () => {
    const noSub = jsonwebtoken.sign({ foo: 'bar' }, SETTINGS.jwtSecret, {
      algorithm: 'HS256',
    });
    const numericSub = jsonwebtoken.sign({ sub: 7 }, SETTINGS.jwtSecret, {
      algorithm: 'HS256',
    });
    expect(jwt.extractUsername(noSub)).toBeNull();
    expect(jwt.extractUsername(numericSub)).toBeNull();
  });

  it('rejects an unsigned (alg=none) token', () => {
    const unsigned = `${Buffer.from(
      JSON.stringify({ alg: 'none', typ: 'JWT' })
    ).toString('base64url')}.${Buffer.from(
      JSON.stringify({ sub: 'user1' })
    ).toString('base64url')}.`;
    expect(jwt.extractUsername(unsigned)).toBeNull();
  });
});
