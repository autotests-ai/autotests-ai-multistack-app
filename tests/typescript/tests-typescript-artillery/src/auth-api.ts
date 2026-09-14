/**
 * Contract chain against teaching /api: health → login → me → items → logout.
 * Official artillery.io native TypeScript (esbuild, not tsc). Open arrivalRate.
 */
import {
  apiBaseUrl,
  duringSeconds,
  jsonHeaders,
  password,
  refuseSharedProd,
  rps,
  username,
} from './config';

const baseUrl = apiBaseUrl();
refuseSharedProd(baseUrl);

const afterResponse = 'recordSample';

export const config = {
  target: baseUrl,
  processor: './processor.ts',
  http: { timeout: 15 },
  defaults: {
    headers: jsonHeaders(),
  },
  phases: [
    {
      duration: duringSeconds(),
      arrivalRate: rps(),
      name: 'auth-api',
    },
  ],
};

export const before = {
  flow: [{ function: 'openJsonl' }],
};

export const scenarios = [
  {
    name: 'auth-api',
    flow: [
      { get: { url: '/api/health', name: 'health', afterResponse } },
      {
        post: {
          url: '/api/auth/login',
          name: 'login',
          json: { username: username(), password: password() },
          capture: [{ json: '$.token', as: 'token' }],
          afterResponse,
        },
      },
      {
        get: {
          url: '/api/auth/me',
          name: 'me',
          headers: { Authorization: 'Bearer {{ token }}' },
          afterResponse,
        },
      },
      { get: { url: '/api/items', name: 'items', afterResponse } },
      { post: { url: '/api/auth/logout', name: 'logout', afterResponse } },
    ],
  },
];
