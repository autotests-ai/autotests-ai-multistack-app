/**
 * Contract chain against teaching /api: health → login → me → items → logout.
 * Default injection is 1 VU (local smoke). K6_PROFILE=load holds N concurrent
 * users (closed model, like Gatling injectClosed / JMeter loops=-1).
 * k6 runs this .ts file directly — no tsc emit, not xk6.
 */
import http from 'k6/http';
import { check } from 'k6';
import {
  apiBaseUrl,
  jsonHeaders,
  loadOptions,
  loginJson,
  refuseSharedProd,
  username,
} from './config.ts';

const baseUrl = apiBaseUrl();
refuseSharedProd(baseUrl);

export const options = loadOptions();

export default function authApi(): void {
  const headers = jsonHeaders();

  const health = http.get(`${baseUrl}/api/health`, { headers });
  check(health, {
    'health 200': (r) => r.status === 200,
    'health status ok': (r) => r.json('status') === 'ok',
  });

  const login = http.post(`${baseUrl}/api/auth/login`, loginJson(), { headers });
  check(login, {
    'login 200': (r) => r.status === 200,
    'login username': (r) => r.json('username') === username(),
    'login token': (r) => Boolean(r.json('token')),
  });
  const token = login.json('token');

  const me = http.get(`${baseUrl}/api/auth/me`, {
    headers: { ...headers, Authorization: `Bearer ${token}` },
  });
  check(me, {
    'me 200': (r) => r.status === 200,
    'me username': (r) => r.json('username') === username(),
  });

  const items = http.get(`${baseUrl}/api/items`, { headers });
  check(items, {
    'items 200': (r) => r.status === 200,
    'items[0].id': (r) => Boolean(r.json('items.0.id')),
  });

  const logout = http.post(`${baseUrl}/api/auth/logout`, null, { headers });
  check(logout, {
    'logout 204': (r) => r.status === 204,
  });
}
