import type { NextFunction, Request, Response } from 'express';
import { Histogram, register } from 'prom-client';

export { register };

export const httpServerRequestsSeconds = new Histogram({
  name: 'http_server_requests_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'uri', 'status'],
});

export function requestUri(req: { originalUrl?: string; url?: string }): string {
  return (req.originalUrl ?? req.url ?? '').split('?')[0] || 'unknown';
}

export function observeHttp(req: Request, res: Response): void {
  const end = httpServerRequestsSeconds.startTimer();
  res.on('finish', () => {
    end({
      method: req.method,
      uri: requestUri(req),
      status: String(res.statusCode),
    });
  });
}

export function httpMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  observeHttp(req, res);
  next();
}
