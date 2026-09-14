/**
 * Stream vegeta-compatible JSONL while Artillery runs (not only the final report.json).
 * Overlay: build/artillery/results.json → load_injector_* (not artillery_*).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { apiBaseUrl, refuseSharedProd } = require('./config');

refuseSharedProd(apiBaseUrl());

const OUT =
  process.env.ARTILLERY_JSONL ||
  path.join(__dirname, '..', 'build', 'artillery', 'results.json');

let fd = null;

function openJsonl(_context, _events, done) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  if (fd != null) {
    try {
      fs.closeSync(fd);
    } catch (_err) {
      /* already closed */
    }
  }
  fd = fs.openSync(OUT, 'w');
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
  fs.writeSync(fd, line);
  return next();
}

module.exports = { openJsonl, recordSample };
