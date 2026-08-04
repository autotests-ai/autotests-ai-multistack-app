import { useEffect, useMemo, useState } from 'react';
import { Badge, Link, Panel } from '@zero-design-system/react';
import { appPath } from '../lib/appBase';
import {
  mountHeaderPollToggle,
  whenHeaderReady,
} from '../../../../_shared/poll-toggle';
import {
  comboHref,
  componentTestsMeta,
  componentTestsPath,
  fetchStackMatrix,
  findById,
  GITHUB_MARK_PATH,
  githubModuleHref,
  isOpenable,
  parseMount,
  parseTestsId,
  resolveTestsId,
  shortModuleLabel,
  stackHref,
  summarizeMatrix,
  unitTestsMeta,
  unitTestsPath,
  type BackendModule,
  type FrontendModule,
  type StackMatrix,
  type TestsModule,
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
  kind: 'backend' | 'frontend' | 'tests';
  id: string;
  modulePath?: string | null;
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
      title={modulePath || undefined}
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

function TestsBoard({
  tests,
  currentBackend,
  currentFrontend,
  currentTests,
  backend,
  frontend,
}: {
  tests: TestsModule[];
  currentBackend: string | null;
  currentFrontend: string | null;
  currentTests: string | null;
  backend: BackendModule | null;
  frontend: FrontendModule | null;
}) {
  const unitPath = unitTestsPath(backend);
  const componentPath = componentTestsPath(frontend);
  const unitMeta = unitTestsMeta(backend);
  const componentMeta = componentTestsMeta(componentPath);

  const derived = [
    {
      layer: 'unit',
      bound: currentBackend,
      path: unitPath,
      label: shortModuleLabel(unitPath) || 'unit',
      meta: unitMeta,
      present: Boolean(unitPath),
    },
    {
      layer: 'component',
      bound: currentFrontend,
      path: componentPath,
      label: shortModuleLabel(componentPath) || 'component',
      meta: componentMeta,
      present: Boolean(componentPath),
    },
  ] as const;

  return (
    <table className="stack-page__table stack-page__table--tests">
      <thead>
        <tr>
          <th>Module</th>
          <th>Layers</th>
          <th className="stack-page__gh-cell">GH</th>
          <th>Status</th>
          <th>Select</th>
        </tr>
      </thead>
      <tbody>
        {derived.map((row) => {
          const status = row.present ? 'derived' : 'slot';
          const isActive = Boolean(row.bound);
          const ghHref = githubModuleHref(row.path);
          return (
            <tr key={row.layer} className={isActive ? 'stack-page__row--active' : undefined}>
              <td>
                {ghHref ? (
                  <a
                    className={`link stack-page__id${isActive ? ' is-active' : ''}`}
                    href={ghHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`stack-tests-${row.layer}`}
                  >
                    {row.label}
                  </a>
                ) : (
                  <span
                    className={`stack-page__id stack-page__id--disabled${isActive ? ' is-active' : ''}`}
                    data-testid={`stack-tests-${row.layer}`}
                  >
                    {row.label}
                  </span>
                )}
                <div className="text text--sm text--muted stack-page__meta">{row.meta}</div>
              </td>
              <td className="stack-page__layers-cell">
                <span className="stack-page__layers" data-testid="stack-tests-layers">
                  {row.layer}
                </span>
              </td>
              <td className="stack-page__gh-cell">
                {ghHref ? (
                  <GithubModuleLink kind="tests" id={row.layer} modulePath={row.path} />
                ) : (
                  <span className="text text--sm text--muted">—</span>
                )}
              </td>
              <td>
                <Badge>{status}</Badge>
              </td>
              <td>
                <span className="text text--sm text--muted">—</span>
              </td>
            </tr>
          );
        })}
        {tests.map((item) => {
          const id = item.id;
          const status = item.status || 'active';
          const layers = (item.layers || []).join(' · ');
          const meta = `${item.language || 'tests'} · ${status}`;
          const isCurrent = id === currentTests;
          const selectable =
            isOpenable(status) && Boolean(currentBackend && currentFrontend);
          const href = stackHref(currentBackend, currentFrontend, id);
          return (
            <tr key={id} className={isCurrent ? 'stack-page__row--active' : undefined}>
              <td>
                {selectable ? (
                  <Link
                    className={`stack-page__id${isCurrent ? ' is-active' : ''}`}
                    href={href}
                    data-testid={`stack-tests-${id}`}
                  >
                    {id}
                  </Link>
                ) : (
                  <span
                    className={`stack-page__id stack-page__id--disabled${isCurrent ? ' is-active' : ''}`}
                    data-testid={`stack-tests-${id}`}
                  >
                    {id}
                  </span>
                )}
                <div className="text text--sm text--muted stack-page__meta">{meta}</div>
              </td>
              <td className="stack-page__layers-cell">
                {layers ? (
                  <span className="stack-page__layers" data-testid="stack-tests-layers">
                    {layers}
                  </span>
                ) : (
                  <span className="text text--sm text--muted">—</span>
                )}
              </td>
              <td className="stack-page__gh-cell">
                {githubModuleHref(item.module) ? (
                  <GithubModuleLink kind="tests" id={id} modulePath={item.module} />
                ) : (
                  <span className="text text--sm text--muted">—</span>
                )}
              </td>
              <td>
                <Badge variant={status === 'active' ? 'primary' : 'default'}>{status}</Badge>
              </td>
              <td>
                {selectable ? (
                  <Link
                    className={`stack-page__open${isCurrent ? ' is-active' : ''}`}
                    href={href}
                  >
                    select →
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
  const requestedTests = useMemo(() => parseTestsId(window.location.search), []);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

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
  }, [reloadToken]);

  useEffect(() => {
    return whenHeaderReady(() =>
      mountHeaderPollToggle({
        defaultOn: true,
        onTick: () => setReloadToken((n) => n + 1),
      }),
    );
  }, []);

  const summary = state.status === 'loaded' ? summarizeMatrix(state.data) : null;
  const currentTests =
    state.status === 'loaded' ? resolveTestsId(state.data, requestedTests) : null;
  const backend = summary ? findById(summary.backends, mount.backendId) : null;
  const frontend = summary ? findById(summary.frontends, mount.frontendId) : null;

  const labelParts: string[] = [];
  if (mount.backendId && mount.frontendId) {
    labelParts.push(`${mount.backendId} · ${mount.frontendId}`);
  } else if (mount.frontendId) {
    labelParts.push(`(no backend prefix) · ${mount.frontendId}`);
  } else {
    labelParts.push('path without /{backend}/{frontend}/');
  }
  if (currentTests) labelParts.push(currentTests);
  const label = labelParts.join(' · ');
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
        <>
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
          <Panel
            title="Tests"
            bodyClassName="stack-page__board-body"
            className="stack-page__board stack-page__board--tests"
            testId="stack-tests-board"
          >
            <TestsBoard
              tests={summary.tests}
              currentBackend={mount.backendId}
              currentFrontend={mount.frontendId}
              currentTests={currentTests}
              backend={backend}
              frontend={frontend}
            />
          </Panel>
        </>
      )}
    </main>
  );
}
