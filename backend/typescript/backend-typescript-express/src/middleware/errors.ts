import type { ErrorRequestHandler, Request, Response } from 'express';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Not found' });
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  // Body-parser rejects malformed JSON before any route sees it.
  if (error instanceof SyntaxError) {
    res.status(400).json({ message: 'Malformed JSON body' });
    return;
  }
  res.status(500).json({ message: 'Internal server error' });
};
