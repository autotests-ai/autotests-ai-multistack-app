'use strict';

const cors = require('cors');
const yaml = require('js-yaml');
const { SwaggerModule } = require('@nestjs/swagger');

const { ApiExceptionFilter } = require('./api-exception.filter');
const { HttpMetricsInterceptor } = require('./http-metrics.interceptor');
const { lenientJson } = require('./json-body');
const { readOpenApiResource } = require('./openapi-resources');

const CORS_OPTIONS = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['Authorization'],
  credentials: false,
};

/** Nest options shared by the server and the tests; the default body parser is off. */
const NEST_OPTIONS = { bodyParser: false };

function setupOpenApiUi(app) {
  const document = yaml.load(readOpenApiResource('openapi.yaml').toString('utf8'));
  // UI over the file copy. Not DocumentBuilder / decorator scan.
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'autotests-ai-multistack-app API',
    ui: true,
    raw: false,
  });
}

function configureApp(app) {
  app.use('/api', cors(CORS_OPTIONS));
  app.use(lenientJson());
  app.useGlobalInterceptors(new HttpMetricsInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());
  setupOpenApiUi(app);
  return app;
}

module.exports = { configureApp, CORS_OPTIONS, NEST_OPTIONS };
