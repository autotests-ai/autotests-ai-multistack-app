/**
 * Stream vegeta-compatible JSONL while Artillery runs (not only the final report.json).
 * Overlay: build/artillery/results.json → load_injector_* (not artillery_*).
 * Login once (vegeta prepare analogue); scenarios are one HTTP each.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const {
  apiBaseUrl,
  jsonHeaders,
  password,
  refuseSharedProd,
  username,
} = require('./config');

refuseSharedProd(apiBaseUrl());

const OUT =
  process.env.ARTILLERY_JSONL ||
  path.join(__dirname, '..', 'build', 'artillery', 'results.json');
const TOKEN_FILE = path.join(path.dirname(OUT), 'prepare-token');

let fd = null;
let sharedToken = '';

function ensureFd() {
  if (fd != null) {
    return;
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fd = fs.openSync(OUT, 'w');
}

function persistToken(token) {
  sharedToken = token;
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true });
  fs.writeFileSync(TOKEN_FILE, token, 'utf8');
}

function loadToken() {
  if (sharedToken) {
    return sharedToken;
  }
  try {
    sharedToken = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  } catch (_err) {
    return '';
  }
  return sharedToken;
}

function loginOnce() {
  const existing = loadToken();
  if (existing) {
    return Promise.resolve(existing);
  }
  const base = apiBaseUrl();
  return fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ username: username(), password: password() }),
  }).then((res) => {
    return res.text().then((raw) => {
      let body = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch (err) {
        throw new Error(`STOP: artillery prepare login is not JSON: ${raw}`);
      }
      const token = String(body.token || '');
      if (body.username !== username() || !token) {
        throw new Error(`STOP: artillery prepare login rejected: ${raw}`);
      }
      persistToken(token);
      return token;
    });
  });
}

function openJsonl(context, _events, done) {
  ensureFd();
  loginOnce()
    .then((token) => {
      if (context && context.vars) {
        context.vars.token = token;
      }
      done();
    })
    .catch(done);
}

function bindToken(context, _events, done) {
  const token = loadToken();
  if (!token) {
    return done(new Error('STOP: artillery prepare token is empty'));
  }
  context.vars.token = token;
  return done();
}

function latencyNs(res) {
  const phases = (res && res.timings && res.timings.phases) || {};
  const ms = Number(phases.total);
  if (Number.isFinite(ms) && ms >= 0) {
    return Math.round(ms * 1e6);
  }
  return 0;
}

function requestUrl(req) {
  if (!req || typeof req !== 'object') {
    return '';
  }
  return String(req.url || req.uri || req.path || '');
}

function recordSample(req, res, _context, _events, next) {
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
  fs.writeSync(fd, line);
  return next();
}

module.exports = { openJsonl, bindToken, recordSample };
