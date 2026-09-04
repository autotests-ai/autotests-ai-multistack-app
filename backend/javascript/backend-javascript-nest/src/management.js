'use strict';

const http = require('http');

const { register } = require('./metrics');

function createManagementServer() {
  return http.createServer((req, res) => {
    const pathname = new URL(req.url || '/', 'http://127.0.0.1').pathname;
    if (req.method === 'GET' && pathname === '/actuator/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'UP' }));
      return;
    }
    if (req.method === 'GET' && pathname === '/actuator/prometheus') {
      register
        .metrics()
        .then((body) => {
          res.writeHead(200, { 'Content-Type': register.contentType });
          res.end(body);
        })
        .catch(() => {
          res.writeHead(500);
          res.end();
        });
      return;
    }
    res.writeHead(404);
    res.end();
  });
}

module.exports = { createManagementServer };
