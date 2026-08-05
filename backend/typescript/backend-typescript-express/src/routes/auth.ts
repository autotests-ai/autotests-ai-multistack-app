import { Router } from 'express';

import { POST_AUTH_REDIRECT } from '../config';
import { requireAuth } from '../middleware/auth';
import type { JwtService } from '../security/jwt';
import { checkPassword, hashPassword } from '../security/password';
import type { Store } from '../store';
import { UsernameTakenError } from '../store';
import { validateCredentials } from '../validation';

export interface AuthRouterDeps {
  store: Store;
  jwtService: JwtService;
}

export function createAuthRouter(deps: AuthRouterDeps): Router {
  const router = Router();

  const authResponse = (username: string) => ({
    token: deps.jwtService.createToken(username),
    username,
    redirectUrl: POST_AUTH_REDIRECT,
  });

  router.post('/register', async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const error = validateCredentials(body.username, body.password);
    if (error !== null) {
      res.status(400).json({ message: error });
      return;
    }

    const username = body.username as string;
    const password = body.password as string;

    if ((await deps.store.findUserByUsername(username)) !== null) {
      res.status(409).json({ message: 'Username already taken' });
      return;
    }

    try {
      await deps.store.insertUser(username, await hashPassword(password));
    } catch (insertError) {
      if (insertError instanceof UsernameTakenError) {
        res.status(409).json({ message: 'Username already taken' });
        return;
      }
      throw insertError;
    }

    res.status(201).json(authResponse(username));
  });

  router.post('/login', async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const error = validateCredentials(body.username, body.password);
    if (error !== null) {
      res.status(400).json({ message: error });
      return;
    }

    const username = body.username as string;
    const password = body.password as string;

    const user = await deps.store.findUserByUsername(username);
    if (user === null || !(await checkPassword(password, user.passwordHash))) {
      res.status(401).json({ message: 'Wrong login or password' });
      return;
    }

    res.json(authResponse(username));
  });

  router.post('/logout', (_req, res) => {
    res.status(204).end();
  });

  router.get('/me', requireAuth(deps), (_req, res) => {
    res.json({ username: res.locals.username as string });
  });

  return router;
}
