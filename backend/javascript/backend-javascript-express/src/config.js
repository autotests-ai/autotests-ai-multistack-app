'use strict';

const SERVICE_NAME = 'backend-javascript-express';
const DEFAULT_DB_NAME = 'multistack_app_javascript_express';

function env(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

function databaseUrl() {
  const url = env('DATABASE_URL');
  if (url) {
    return url;
  }
  const host = env('DB_HOST', 'localhost');
  const port = env('DB_PORT', '5432');
  const name = env('DB_NAME', DEFAULT_DB_NAME);
  const user = env('DB_USER', 'multistack');
  const password = env('DB_PASSWORD', 'multistack');
  return `postgresql://${user}:${password}@${host}:${port}/${name}`;
}

function config() {
  return {
    serviceName: SERVICE_NAME,
    databaseUrl: databaseUrl(),
    serverPort: Number(env('SERVER_PORT', '8080')),
    managementPort: Number(env('MANAGEMENT_PORT', '8081')),
    jwtSecret: env(
      'JWT_SECRET',
      'multistack-dev-secret-change-in-production-min-32-chars'
    ),
    jwtExpirationMs: Number(env('JWT_EXPIRATION_MS', '86400000')),
    postAuthRedirect: '/',
  };
}

module.exports = { SERVICE_NAME, DEFAULT_DB_NAME, config, databaseUrl };
