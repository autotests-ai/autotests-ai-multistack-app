/**
 * One HTTP per scenario (health / login / me / items / logout), not a 5-step flow.
 * Login token is prepared once in processor openJsonl (vegeta analogue).
 * Official artillery.io native TypeScript (esbuild, not tsc). Open arrivalRate = HTTP/s.
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
    name: 'health',
    weight: 1,
    flow: [{ get: { url: '/api/health', name: 'health', afterResponse } }],
  },
  {
    name: 'login',
    weight: 1,
    flow: [
      {
        post: {
          url: '/api/auth/login',
          name: 'login',
          json: { username: username(), password: password() },
          afterResponse,
        },
      },
    ],
  },
  {
    name: 'me',
    weight: 1,
    flow: [
      { function: 'bindToken' },
      {
        get: {
          url: '/api/auth/me',
          name: 'me',
          headers: { Authorization: 'Bearer {{ token }}' },
          afterResponse,
        },
      },
    ],
  },
  {
    name: 'items',
    weight: 1,
    flow: [{ get: { url: '/api/items', name: 'items', afterResponse } }],
  },
  {
    name: 'logout',
    weight: 1,
    flow: [
      { function: 'bindToken' },
      {
        post: {
          url: '/api/auth/logout',
          name: 'logout',
          headers: { Authorization: 'Bearer {{ token }}' },
          afterResponse,
        },
      },
    ],
  },
];
