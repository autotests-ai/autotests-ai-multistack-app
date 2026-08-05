import jwt from 'jsonwebtoken';

export class JwtService {
  constructor(
    private readonly secret: string,
    private readonly expirationMs: number,
  ) {}

  createToken(username: string): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    return jwt.sign(
      {
        sub: username,
        iat: issuedAt,
        exp: issuedAt + Math.floor(this.expirationMs / 1000),
      },
      this.secret,
      { algorithm: 'HS256' },
    );
  }

  /** Returns the `sub` claim of a valid token, or `null` for anything unusable. */
  extractUsername(token: string): string | null {
    try {
      const payload = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
      if (typeof payload === 'string') {
        return null;
      }
      return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
