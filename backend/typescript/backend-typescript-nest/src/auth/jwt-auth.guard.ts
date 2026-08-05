import { HttpStatus, Inject, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { ApiException } from '../common/api-exception';
import { JwtService } from '../security/jwt.service';
import { STORE, type Store } from '../store/store';

const BEARER_PREFIX = 'Bearer ';

export interface AuthenticatedRequest extends Request {
  username?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(STORE) private readonly store: Store,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.header('authorization') ?? '';
    if (!header.startsWith(BEARER_PREFIX)) {
      throw this.unauthorized();
    }

    const username = this.jwtService.extractUsername(header.slice(BEARER_PREFIX.length));
    if (username === null) {
      throw this.unauthorized();
    }

    // A token for a user that has since disappeared is not a valid credential.
    if ((await this.store.findUserByUsername(username)) === null) {
      throw this.unauthorized();
    }

    request.username = username;
    return true;
  }

  private unauthorized(): ApiException {
    return new ApiException(HttpStatus.UNAUTHORIZED, 'Unauthorized');
  }
}
