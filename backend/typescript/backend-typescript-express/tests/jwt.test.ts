import jwt from 'jsonwebtoken';

import { JwtService } from '../src/security/jwt';

const SECRET = 'test-secret-key-at-least-32-characters-long';

describe('JwtService', () => {
  const service = new JwtService(SECRET, 86_400_000);

  it('round-trips the username', () => {
    const token = service.createToken('user1');
    expect(service.extractUsername(token)).toBe('user1');
  });

  it('signs HS256 with sub, iat and exp claims', () => {
    const before = Math.floor(Date.now() / 1000);
    const token = service.createToken('user1');

    const header = JSON.parse(
      Buffer.from(token.split('.')[0] as string, 'base64url').toString('utf8'),
    ) as { alg: string };
    expect(header.alg).toBe('HS256');

    const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;
    expect(payload.sub).toBe('user1');
    expect(payload.iat).toBeGreaterThanOrEqual(before);
    expect(payload.exp).toBe((payload.iat as number) + 86_400);
  });

  it('rejects a token signed with another secret', () => {
    const foreign = new JwtService('another-secret-key-at-least-32-characters', 86_400_000);
    expect(service.extractUsername(foreign.createToken('user1'))).toBeNull();
  });

  it('rejects a garbage token', () => {
    expect(service.extractUsername('not-a-token')).toBeNull();
    expect(service.extractUsername('')).toBeNull();
  });

  it('rejects an expired token', () => {
    const expired = new JwtService(SECRET, -1000).createToken('user1');
    expect(service.extractUsername(expired)).toBeNull();
  });

  it('rejects a token whose payload is a bare string', () => {
    const stringToken = jwt.sign('user1', SECRET, { algorithm: 'HS256' });
    expect(service.extractUsername(stringToken)).toBeNull();
  });

  it('rejects a token without a string sub claim', () => {
    const noSub = jwt.sign({ iat: 1 }, SECRET, { algorithm: 'HS256' });
    expect(service.extractUsername(noSub)).toBeNull();
  });
});
