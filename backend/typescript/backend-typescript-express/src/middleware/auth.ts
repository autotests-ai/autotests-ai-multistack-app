import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type { JwtService } from '../security/jwt';
import type { Store } from '../store';

const BEARER_PREFIX = 'Bearer ';

export interface AuthGuardDeps {
  jwtService: JwtService;
  store: Store;
}

function unauthorized(res: Response): void {
  res.status(401).json({ message: 'Unauthorized' });
}

export function requireAuth(deps: AuthGuardDeps): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.header('authorization') ?? '';
    if (!header.startsWith(BEARER_PREFIX)) {
      unauthorized(res);
      return;
    }

    const username = deps.jwtService.extractUsername(header.slice(BEARER_PREFIX.length));
    if (username === null) {
      unauthorized(res);
      return;
    }

    // A token for a user that has since disappeared is not a valid credential.
    if ((await deps.store.findUserByUsername(username)) === null) {
      unauthorized(res);
      return;
    }

    res.locals.username = username;
    next();
  };
}
