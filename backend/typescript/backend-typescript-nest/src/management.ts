import http from 'http';

import { register } from './metrics';

export function createManagementServer(): http.Server {
  return http.createServer((req, res) => {
    void handleManagementRequest(req, res);
  });
}

async function handleManagementRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const pathname = new URL(req.url ?? '/', 'http://127.0.0.1').pathname;
  if (req.method === 'GET' && pathname === '/actuator/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'UP' }));
    return;
  }
  if (req.method === 'GET' && pathname === '/actuator/prometheus') {
    try {
      const body = await register.metrics();
      res.writeHead(200, { 'Content-Type': register.contentType });
      res.end(body);
    } catch {
      res.writeHead(500);
      res.end();
    }
    return;
  }
  res.writeHead(404);
  res.end();
}
