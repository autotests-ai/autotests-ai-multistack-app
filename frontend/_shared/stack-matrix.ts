/**
 * Stack matrix helpers — shared by React / Vue product pages.
 * Data SSOT: frontend/_shared/frontend-javascript-app/stack/matrix.json
 *   ← python frontend/scripts/sync-stack-matrix.py ← deploy/matrix.yaml
 * Logic mirror: frontend/_shared/frontend-javascript-app/js/stack-matrix.js
 */

const PATH_RE = /^\/(backend-[^/]+)\/(frontend-[^/]+)/;

/** Nested product repo on GitHub — tree URLs for matrix `module` paths. */
export const GITHUB_TREE_BASE =
  'https://github.com/autotests-ai/reference-app-copy/tree/main';

/** Octocat mark path (viewBox 0 0 24 24) — same as product header. */
export const GITHUB_MARK_PATH =
  'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z';

export type ModuleStatus = 'active' | 'slot' | 'stub' | string;

export interface BackendModule {
  id: string;
  status?: ModuleStatus;
  language?: string;
  module?: string;
}

export interface FrontendModule {
  id: string;
  status?: ModuleStatus;
  kind?: string;
  module?: string;
}

export interface StackMatrix {
  backends: BackendModule[];
  frontends: FrontendModule[];
}

export interface MountPair {
  backendId: string | null;
  frontendId: string | null;
}

export function parseMount(pathname: string): MountPair {
  const match = pathname.match(PATH_RE);
  if (match) {
    return { backendId: match[1], frontendId: match[2] };
  }
  const fe = pathname.match(/^\/(frontend-[^/]+)/);
  return {
    backendId: null,
    frontendId: fe ? fe[1] : null,
  };
}

export function isOpenable(status: ModuleStatus | undefined): boolean {
  return status === 'active' || status === 'stub';
}

export function comboHref(
  backendId: string | null,
  frontendId: string | null,
  path = '/',
): string {
  let p = path == null || path === '' ? '/' : String(path);
  if (!p.startsWith('/')) p = `/${p}`;
  if (!backendId || !frontendId) {
    return frontendId ? `/${frontendId}${p === '/' ? '/' : p}` : p;
  }
  return `/${backendId}/${frontendId}${p === '/' ? '/' : p}`;
}

export function stackHref(backendId: string | null, frontendId: string | null): string {
  return comboHref(backendId, frontendId, '/stack/');
}

/** GitHub folder for a matrix module path (`backend/python/...`). */
export function githubModuleHref(modulePath: string | null | undefined): string | null {
  if (!modulePath) return null;
  const cleaned = String(modulePath).replace(/^\/+/, '').replace(/\/+$/, '');
  if (!cleaned || cleaned.includes('..')) return null;
  return `${GITHUB_TREE_BASE}/${cleaned}`;
}

export function findModuleById(
  items: Array<{ id: string; module?: string }>,
  id: string | null,
): string | null {
  if (!id) return null;
  return items.find((item) => item.id === id)?.module ?? null;
}

export function summarizeMatrix(data: StackMatrix) {
  return {
    backends: data.backends ?? [],
    frontends: data.frontends ?? [],
  };
}

/** Fetch public matrix artifact under the product /stack/ mount. */
export async function fetchStackMatrix(matrixUrl: string): Promise<StackMatrix> {
  const res = await fetch(matrixUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<StackMatrix>;
}
