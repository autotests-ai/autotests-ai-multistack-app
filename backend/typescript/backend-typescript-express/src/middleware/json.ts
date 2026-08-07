import express, { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import type { IncomingMessage } from 'node:http';

export const INVALID_JSON_MESSAGE = 'Request body is not valid JSON';

interface MeasuredRequest extends IncomingMessage {
  rawBodyLength?: number;
}

/**
 * body-parser turns an empty body into `{}`, so the parsed value alone cannot tell an empty
 * request apart from a literal `{}`. The raw length recorded here can.
 */
export const jsonBodyParser: RequestHandler = express.json({
  verify: (req, _res, buf) => {
    (req as MeasuredRequest).rawBodyLength = buf.length;
  },
});

/**
 * Guards the endpoints that read a body: only a JSON object reaches the handler, everything
 * else answers like a parse failure. A body that is not JSON at all never gets this far —
 * body-parser rejects it and `errorHandler` answers with the same message.
 */
export function requireJsonObjectBody(req: Request, res: Response, next: NextFunction): void {
  const body: unknown = req.body;
  const empty = (req as MeasuredRequest).rawBodyLength === 0;

  if (empty || typeof body !== 'object' || body === null || Array.isArray(body)) {
    res.status(400).json({ message: INVALID_JSON_MESSAGE });
    return;
  }
  next();
}
