'use strict';

const client = require('prom-client');

const httpServerRequestsSeconds = new client.Histogram({
  name: 'http_server_requests_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'uri', 'status'],
});

function requestUri(req) {
  return (req.originalUrl || req.url || '').split('?')[0] || 'unknown';
}

function observeHttp(req, res) {
  const end = httpServerRequestsSeconds.startTimer();
  res.on('finish', () => {
    end({
      method: req.method,
      uri: requestUri(req),
      status: String(res.statusCode),
    });
  });
}

function httpMetricsMiddleware(req, res, next) {
  observeHttp(req, res);
  next();
}

module.exports = {
  register: client.register,
  httpServerRequestsSeconds,
  observeHttp,
  httpMetricsMiddleware,
};
