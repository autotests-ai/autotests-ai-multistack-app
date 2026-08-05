import type { NextFunction, Request, Response } from 'express';

/** Open CORS for `/api/**`: every origin, no credentials, Authorization exposed. */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.header('access-control-request-headers') ?? '*',
  );
  res.setHeader('Access-Control-Expose-Headers', 'Authorization');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
}
