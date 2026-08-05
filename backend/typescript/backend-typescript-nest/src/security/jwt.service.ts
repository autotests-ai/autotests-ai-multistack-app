import { Inject, Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';

import { APP_CONFIG } from '../config.module';
import type { AppConfig } from '../config';

@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly expirationMs: number;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.secret = config.jwtSecret;
    this.expirationMs = config.jwtExpirationMs;
  }

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
