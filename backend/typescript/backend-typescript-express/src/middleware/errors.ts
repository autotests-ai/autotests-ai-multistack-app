import type { ErrorRequestHandler, Request, Response } from 'express';

import { INVALID_JSON_MESSAGE } from './json';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Not found' });
}

/**
 * Unmapped paths under `/api` are 401, not 404: the reference authenticates `/api/**` in its
 * security chain, before routing can report a missing handler.
 */
export function apiFallbackHandler(_req: Request, res: Response): void {
  res.status(401).json({ message: 'Unauthorized' });
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  // Body-parser rejects malformed JSON before any route sees it.
  if (error instanceof SyntaxError) {
    res.status(400).json({ message: INVALID_JSON_MESSAGE });
    return;
  }
  res.status(500).json({ message: 'Internal server error' });
};
