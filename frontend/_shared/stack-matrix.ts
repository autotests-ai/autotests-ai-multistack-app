/**
 * Stack matrix helpers — shared by React / Vue product pages.
 * Data SSOT: frontend/_shared/frontend-javascript-app/stack/matrix.json
 *   ← python frontend/scripts/sync-stack-matrix.py ← deploy/matrix.yaml
 * Logic mirror: frontend/_shared/frontend-javascript-app/js/stack-matrix.js
 */

const PATH_RE = /^\/(backend-[^/]+)\/(frontend-[^/]+)/;

export type ModuleStatus = 'active' | 'slot' | 'stub' | string;

export interface BackendModule {
  id: string;
  status?: ModuleStatus;
  language?: string;
}

export interface FrontendModule {
  id: string;
  status?: ModuleStatus;
  kind?: string;
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
