'use strict';

const cors = require('cors');

const { ApiExceptionFilter } = require('./api-exception.filter');
const { lenientJson } = require('./json-body');

const CORS_OPTIONS = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['Authorization'],
  credentials: false,
};

/** Nest options shared by the server and the tests; the default body parser is off. */
const NEST_OPTIONS = { bodyParser: false };

function configureApp(app) {
  app.use('/api', cors(CORS_OPTIONS));
  app.use(lenientJson());
  app.useGlobalFilters(new ApiExceptionFilter());
  return app;
}

module.exports = { configureApp, CORS_OPTIONS, NEST_OPTIONS };
