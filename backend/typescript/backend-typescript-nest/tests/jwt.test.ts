import jwt from 'jsonwebtoken';

import type { AppConfig } from '../src/config';
import { JwtService } from '../src/security/jwt.service';

import { TEST_CONFIG, TEST_SECRET } from './support/app';

function serviceWith(overrides: Partial<AppConfig>): JwtService {
  return new JwtService({ ...TEST_CONFIG, ...overrides });
}

describe('JwtService', () => {
  const service = new JwtService(TEST_CONFIG);

  it('round-trips the username', () => {
    expect(service.extractUsername(service.createToken('user1'))).toBe('user1');
  });

  it('signs HS256 with sub, iat and exp claims', () => {
    const before = Math.floor(Date.now() / 1000);
    const token = service.createToken('user1');

    const header = JSON.parse(
      Buffer.from(token.split('.')[0] as string, 'base64url').toString('utf8'),
    ) as { alg: string };
    expect(header.alg).toBe('HS256');

    const payload = jwt.verify(token, TEST_SECRET) as jwt.JwtPayload;
    expect(payload.sub).toBe('user1');
    expect(payload.iat).toBeGreaterThanOrEqual(before);
    expect(payload.exp).toBe((payload.iat as number) + 86_400);
  });

  it('rejects a token signed with another secret', () => {
    const foreign = serviceWith({ jwtSecret: 'another-secret-key-at-least-32-characters' });
    expect(service.extractUsername(foreign.createToken('user1'))).toBeNull();
  });

  it('rejects a garbage token', () => {
    expect(service.extractUsername('not-a-token')).toBeNull();
    expect(service.extractUsername('')).toBeNull();
  });

  it('rejects an expired token', () => {
    const expired = serviceWith({ jwtExpirationMs: -1000 }).createToken('user1');
    expect(service.extractUsername(expired)).toBeNull();
  });

  it('rejects a token whose payload is a bare string', () => {
    const stringToken = jwt.sign('user1', TEST_SECRET, { algorithm: 'HS256' });
    expect(service.extractUsername(stringToken)).toBeNull();
  });

  it('rejects a token without a string sub claim', () => {
    const noSub = jwt.sign({ iat: 1 }, TEST_SECRET, { algorithm: 'HS256' });
    expect(service.extractUsername(noSub)).toBeNull();
  });
});
