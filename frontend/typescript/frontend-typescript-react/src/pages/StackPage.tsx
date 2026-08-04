import { useEffect, useMemo, useState } from 'react';
import { Badge, Link, Panel } from '@zero-design-system/react';
import { appPath } from '../lib/appBase';
import {
  comboHref,
  fetchStackMatrix,
  GITHUB_MARK_PATH,
  githubModuleHref,
  isOpenable,
  parseMount,
  stackHref,
  summarizeMatrix,
  type BackendModule,
  type FrontendModule,
  type StackMatrix,
} from '../../../../_shared/stack-matrix';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; data: StackMatrix };

function GithubModuleLink({
  kind,
  id,
  modulePath,
}: {
  kind: 'backend' | 'frontend';
  id: string;
  modulePath?: string;
}) {
  const href = githubModuleHref(modulePath);
  if (!href) return null;
  return (
    <a
      className="icon-btn stack-page__gh-icon"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`GitHub ${id}`}
      title={modulePath}
      data-testid={`stack-gh-${kind}-${id}`}
    >
      <span className="icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d={GITHUB_MARK_PATH} />
        </svg>
      </span>
    </a>
  );
}

function ModuleRows({
  kind,
  items,
  currentBackend,
  currentFrontend,
}: {
  kind: 'backend' | 'frontend';
  items: Array<BackendModule | FrontendModule>;
  currentBackend: string | null;
  currentFrontend: string | null;
}) {
  return (
    <table className="stack-page__table">
      <thead>
        <tr>
          <th>Module</th>
          <th className="stack-page__gh-cell">GH</th>
          <th>Status</th>
          <th>Open</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const id = item.id;
          const status = item.status || 'active';
          const meta =
            kind === 'backend'
              ? `${(item as BackendModule).language || 'backend'} · ${status}`
              : `${(item as FrontendModule).kind || 'frontend'} · ${status}`;
          const isCurrent = kind === 'backend' ? id === currentBackend : id === currentFrontend;
          const targetBackend = kind === 'backend' ? id : currentBackend;
          const targetFrontend = kind === 'frontend' ? id : currentFrontend;
          const href = stackHref(targetBackend, targetFrontend);
          const openable = isOpenable(status) && Boolean(targetBackend && targetFrontend);

          return (
            <tr key={id} className={isCurrent ? 'stack-page__row--active' : undefined}>
              <td>
                {openable ? (
                  <Link
                    className={`stack-page__id${isCurrent ? ' is-active' : ''}`}
                    href={href}
                    data-testid={`stack-${kind}-${id}`}
                  >
                    {id}
                  </Link>
                ) : (
                  <span
                    className={`stack-page__id stack-page__id--disabled${isCurrent ? ' is-active' : ''}`}
                    data-testid={`stack-${kind}-${id}`}
                  >
                    {id}
                  </span>
                )}
                <div className="text text--sm text--muted stack-page__meta">{meta}</div>
              </td>
              <td className="stack-page__gh-cell">
                {githubModuleHref(item.module) ? (
                  <GithubModuleLink kind={kind} id={id} modulePath={item.module} />
                ) : (
                  <span className="text text--sm text--muted">—</span>
                )}
              </td>
              <td>
                <Badge variant={status === 'active' ? 'primary' : 'default'}>{status}</Badge>
              </td>
              <td>
                {openable ? (
                  <Link
                    className={`stack-page__open${isCurrent ? ' is-active' : ''}`}
                    href={href}
                  >
                    open →
                  </Link>
                ) : (
                  <span className="text text--sm text--muted">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function StackPage() {
  const mount = useMemo(() => parseMount(window.location.pathname), []);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    fetchStackMatrix(appPath('/stack/matrix.json'))
      .then((data) => {
        if (active) setState({ status: 'loaded', data });
      })
      .catch((error: Error) => {
        if (active) setState({ status: 'error', message: error.message });
      });
    return () => {
      active = false;
    };
  }, []);

  const summary = state.status === 'loaded' ? summarizeMatrix(state.data) : null;
  const label =
    mount.backendId && mount.frontendId
      ? `${mount.backendId} · ${mount.frontendId}`
      : mount.frontendId
        ? `(no backend prefix) · ${mount.frontendId}`
        : 'path without /{backend}/{frontend}/';
  const homeHref = comboHref(mount.backendId, mount.frontendId, '/');

  return (
    <main
      className="page-shell page-shell--below-header stack-page"
      data-testid="stack-page"
    >
      <div className="stack-page__header">
        <a
          className="badge badge--primary stack-page__current"
          href={homeHref}
          title="open app home"
          data-testid="stack-current-pair"
        >
          {label}
        </a>
      </div>

      {state.status === 'error' && (
        <div className="stack-page__error" data-testid="stack-error">
          Не удалось загрузить matrix.json — sync: python frontend/scripts/sync-stack-matrix.py.{' '}
          {state.message}
        </div>
      )}

      {state.status === 'loading' && (
        <p className="text text--muted" data-testid="stack-loading">
          → Loading matrix…
        </p>
      )}

      {summary && (
        <div className="stack-page__boards">
          <Panel title="Backend" bodyClassName="stack-page__board-body" className="stack-page__board">
            <ModuleRows
              kind="backend"
              items={summary.backends}
              currentBackend={mount.backendId}
              currentFrontend={mount.frontendId}
            />
          </Panel>
          <Panel title="Frontend" bodyClassName="stack-page__board-body" className="stack-page__board">
            <ModuleRows
              kind="frontend"
              items={summary.frontends}
              currentBackend={mount.backendId}
              currentFrontend={mount.frontendId}
            />
          </Panel>
        </div>
      )}
    </main>
  );
}
