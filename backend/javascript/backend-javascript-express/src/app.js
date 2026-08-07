'use strict';

const express = require('express');
const cors = require('cors');

const { config } = require('./config');
const { createJwt } = require('./jwt');
const { createAuthService } = require('./auth-service');
const { lenientJson } = require('./json-body');
const { ApiError } = require('./errors');

const CORS_OPTIONS = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['Authorization'],
  credentials: false,
};

function createApp({ store, settings = config(), jwt } = {}) {
  const jwtUtil = jwt || createJwt(settings);
  const auth = createAuthService({
    store,
    jwt: jwtUtil,
    postAuthRedirect: settings.postAuthRedirect,
  });

  const app = express();
  app.disable('x-powered-by');
  app.use('/api', cors(CORS_OPTIONS));
  app.use('/api', lenientJson());

  const api = express.Router();

  api.get('/health', (req, res) => {
    res.json({ status: 'ok', service: settings.serviceName });
  });

  api.get('/items', async (req, res, next) => {
    try {
      res.json({ items: await store.listItems(), source: 'postgresql' });
    } catch (error) {
      next(error);
    }
  });

  api.post('/auth/register', async (req, res, next) => {
    try {
      res.status(201).json(await auth.register(req.body));
    } catch (error) {
      next(error);
    }
  });

  api.post('/auth/login', async (req, res, next) => {
    try {
      res.json(await auth.login(req.body));
    } catch (error) {
      next(error);
    }
  });

  api.post('/auth/logout', (req, res) => {
    res.status(204).end();
  });

  api.get('/auth/me', async (req, res, next) => {
    try {
      res.json(await auth.profile(req.get('authorization')));
    } catch (error) {
      next(error);
    }
  });

  api.delete('/auth/me', async (req, res, next) => {
    try {
      await auth.deleteAccount(req.get('authorization'));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.use('/api', api);

  // The reference authenticates /api/** before it routes, so an unmapped path —
  // or a method no route there allows — never reaches a 404.
  app.use('/api', (req, res, next) => {
    next(new ApiError(401, 'Unauthorized'));
  });

  app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    if (error instanceof ApiError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  });

  return app;
}

module.exports = { createApp, CORS_OPTIONS };
