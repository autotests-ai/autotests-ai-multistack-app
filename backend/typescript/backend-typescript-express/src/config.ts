export const SERVICE_NAME = 'backend-typescript-express';
export const DEFAULT_DB_NAME = 'reference_app_typescript_express';
export const POST_AUTH_REDIRECT = '/';

export interface AppConfig {
  serviceName: string;
  serverPort: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpirationMs: number;
}

type Env = Record<string, string | undefined>;

export function databaseUrl(env: Env = process.env): string {
  const explicit = env.DATABASE_URL;
  if (explicit) {
    return explicit;
  }
  const host = env.DB_HOST ?? 'localhost';
  const port = env.DB_PORT ?? '5432';
  const name = env.DB_NAME ?? DEFAULT_DB_NAME;
  const user = env.DB_USER ?? 'reference';
  const password = env.DB_PASSWORD ?? 'reference';
  return `postgresql://${user}:${password}@${host}:${port}/${name}`;
}

export function loadConfig(env: Env = process.env): AppConfig {
  return {
    serviceName: SERVICE_NAME,
    serverPort: Number(env.SERVER_PORT ?? '8080'),
    databaseUrl: databaseUrl(env),
    jwtSecret:
      env.JWT_SECRET ?? 'reference-app-dev-secret-change-in-production-min-32-chars',
    jwtExpirationMs: Number(env.JWT_EXPIRATION_MS ?? '86400000'),
  };
}
