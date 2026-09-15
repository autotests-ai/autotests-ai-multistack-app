/**
 * Stream vegeta-compatible JSONL while Artillery runs (not only the final report.json).
 * Overlay: build/artillery/results.json → load_injector_* (not artillery_*).
 * Artillery bundles this .ts processor with esbuild — not tsc.
 * Login once (vegeta prepare analogue); scenarios are one HTTP each.
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  apiBaseUrl,
  jsonHeaders,
  password,
  refuseSharedProd,
  username,
} from './config';

refuseSharedProd(apiBaseUrl());

const OUT =
  process.env.ARTILLERY_JSONL ||
  path.join(__dirname, '..', 'build', 'artillery', 'results.json');
const TOKEN_FILE = path.join(path.dirname(OUT), 'prepare-token');

let fd: number | null = null;
let sharedToken = '';

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

interface ArtilleryContext {
  vars: { [name: string]: string };
}

function ensureFd(): void {
  if (fd != null) {
    return;
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fd = fs.openSync(OUT, 'w');
}

function persistToken(token: string): void {
  sharedToken = token;
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true });
  fs.writeFileSync(TOKEN_FILE, token, 'utf8');
}

function loadToken(): string {
  if (sharedToken) {
    return sharedToken;
  }
  try {
    sharedToken = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  } catch {
    return '';
  }
  return sharedToken;
}

function loginOnce(): Promise<string> {
  const existing = loadToken();
  if (existing) {
    return Promise.resolve(existing);
  }
  const base = apiBaseUrl();
  return fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ username: username(), password: password() }),
  }).then((res) =>
    res.text().then((raw) => {
      let body: { token?: string; username?: string } = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(`STOP: artillery prepare login is not JSON: ${raw}`);
      }
      const token = String(body.token || '');
      if (body.username !== username() || !token) {
        throw new Error(`STOP: artillery prepare login rejected: ${raw}`);
      }
      persistToken(token);
      return token;
    }),
  );
}

export function openJsonl(context: ArtilleryContext, _events: unknown, done: Done): void {
  ensureFd();
  loginOnce()
    .then((token) => {
      if (context && context.vars) {
        context.vars.token = token;
      }
      done();
    })
    .catch((err: Error) => done(err));
}

export function bindToken(context: ArtilleryContext, _events: unknown, done: Done): void {
  const token = loadToken();
  if (!token) {
    done(new Error('STOP: artillery prepare token is empty'));
    return;
  }
  context.vars.token = token;
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
  ensureFd();
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
