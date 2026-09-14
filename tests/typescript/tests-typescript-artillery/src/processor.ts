/**
 * Stream vegeta-compatible JSONL while Artillery runs (not only the final report.json).
 * Overlay: build/artillery/results.json → load_injector_* (not artillery_*).
 * Artillery bundles this .ts processor with esbuild — not tsc.
 */
import * as fs from 'fs';
import * as path from 'path';
import { apiBaseUrl, refuseSharedProd } from './config';

refuseSharedProd(apiBaseUrl());

const OUT =
  process.env.ARTILLERY_JSONL ||
  path.join(__dirname, '..', 'build', 'artillery', 'results.json');

let fd: number | null = null;

type Done = (err?: Error) => void;
type Next = () => void;

interface ArtilleryRes {
  statusCode?: number;
  timings?: { phases?: { total?: number } };
}

interface ArtilleryReq {
  url?: string;
  uri?: string;
  path?: string;
  method?: string;
}

export function openJsonl(_context: unknown, _events: unknown, done: Done): void {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  if (fd != null) {
    try {
      fs.closeSync(fd);
    } catch {
      /* already closed */
    }
  }
  fd = fs.openSync(OUT, 'w');
  done();
}

function latencyNs(res: ArtilleryRes | undefined): number {
  const ms = Number(res && res.timings && res.timings.phases && res.timings.phases.total);
  if (Number.isFinite(ms) && ms >= 0) {
    return Math.round(ms * 1e6);
  }
  return 0;
}

function requestUrl(req: ArtilleryReq | undefined): string {
  if (!req) {
    return '';
  }
  return String(req.url || req.uri || req.path || '');
}

export function recordSample(
  req: ArtilleryReq,
  res: ArtilleryRes,
  _context: unknown,
  _events: unknown,
  next: Next,
): void {
  if (fd == null) {
    openJsonl(null, null, function noop() {});
  }
  const code = Number(res && res.statusCode) || 0;
  const error = code === 0 || code >= 400 ? String((res && res.statusCode) || 'error') : '';
  const line =
    JSON.stringify({
      timestamp: new Date().toISOString(),
      latency: latencyNs(res),
      code,
      error,
      method: String((req && req.method) || ''),
      url: requestUrl(req),
    }) + '\n';
  if (fd != null) {
    fs.writeSync(fd, line);
  }
  next();
}
