import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StackPage } from '../../pages/StackPage';

const MATRIX = {
  backends: [
    {
      id: 'backend-java-spring',
      status: 'active',
      language: 'java',
      module: 'backend/java/backend-java-spring',
    },
  ],
  frontends: [
    {
      id: 'frontend-typescript-react',
      status: 'active',
      kind: 'spa',
      module: 'frontend/typescript/frontend-typescript-react',
    },
  ],
  tests: [
    {
      id: 'tests-java-gradle-junit5-allure3-selenide',
      status: 'active',
      language: 'java',
      module: 'tests/java/tests-java-gradle-junit5-allure3-selenide',
      layers: ['api', 'e2e'],
    },
  ],
};

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

function renderStack() {
  return render(
    <MemoryRouter initialEntries={['/stack']}>
      <StackPage />
    </MemoryRouter>,
  );
}

describe('StackPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('matrix.json')) {
          return Promise.resolve(jsonResponse(MATRIX));
        }
        return Promise.reject(new Error(`unexpected request: ${url}`));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads matrix and shows current pair plus boards', async () => {
    renderStack();

    expect(screen.getByTestId('stack-page')).toBeInTheDocument();
    expect(screen.getByTestId('stack-loading')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('stack-tests-board')).toBeInTheDocument());
    expect(screen.getByTestId('stack-current-pair')).toBeInTheDocument();
    expect(screen.getByTestId('stack-backend-backend-java-spring')).toBeInTheDocument();
    expect(screen.getByTestId('stack-frontend-frontend-typescript-react')).toBeInTheDocument();
  });

  it('backend/frontend open links stay path-only (no ?tests=)', async () => {
    const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      pathname: '/stack/backend-java-spring/frontend-typescript-react/',
      search: '?tests=tests-java-gradle-junit5-allure3-selenide',
    } as Location);

    try {
      renderStack();

      await waitFor(() =>
        expect(screen.getByTestId('stack-frontend-frontend-typescript-react')).toBeInTheDocument(),
      );

      const frontendLink = screen.getByTestId('stack-frontend-frontend-typescript-react');
      expect(frontendLink).toHaveAttribute(
        'href',
        '/stack/backend-java-spring/frontend-typescript-react/',
      );
      expect(frontendLink.getAttribute('href')).not.toContain('?');

      const backendLink = screen.getByTestId('stack-backend-backend-java-spring');
      expect(backendLink).toHaveAttribute(
        'href',
        '/stack/backend-java-spring/frontend-typescript-react/',
      );
      expect(backendLink.getAttribute('href')).not.toContain('?');

      const testsLink = screen.getByTestId('stack-tests-tests-java-gradle-junit5-allure3-selenide');
      expect(testsLink.getAttribute('href')).toContain(
        '?tests=tests-java-gradle-junit5-allure3-selenide',
      );
    } finally {
      locationSpy.mockRestore();
    }
  });

  it('shows matrix load error when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({}, false, 404))),
    );

    renderStack();

    await waitFor(() => expect(screen.getByTestId('stack-error')).toBeInTheDocument());
    expect(screen.getByTestId('stack-error')).toHaveTextContent('matrix.json');
  });

  it('uses CI defaults for open links on bare /stack/', async () => {
    const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      pathname: '/stack/',
      search: '',
    } as Location);

    try {
      renderStack();

      await waitFor(() =>
        expect(screen.getByTestId('stack-frontend-frontend-typescript-react')).toBeInTheDocument(),
      );

      expect(screen.getByTestId('stack-current-pair')).toHaveTextContent(
        'path without /{backend}/{frontend}/',
      );
      expect(screen.getByTestId('stack-frontend-frontend-typescript-react')).toHaveAttribute(
        'href',
        '/stack/backend-java-spring/frontend-typescript-react/',
      );
    } finally {
      locationSpy.mockRestore();
    }
  });

  it('labels frontend-only mounts without a backend prefix', async () => {
    const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      pathname: '/stack/frontend-typescript-react/',
      search: '',
    } as Location);

    try {
      renderStack();

      await waitFor(() => expect(screen.getByTestId('stack-current-pair')).toBeInTheDocument());
      expect(screen.getByTestId('stack-current-pair')).toHaveTextContent(
        '(no backend prefix) · frontend-typescript-react',
      );
    } finally {
      locationSpy.mockRestore();
    }
  });

  it('reloads matrix when the header poll toggle ticks', async () => {
    const tools = document.createElement('div');
    tools.setAttribute('data-testid', 'header-tools');
    document.body.appendChild(tools);

    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('matrix.json')) {
        return Promise.resolve(jsonResponse(MATRIX));
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    renderStack();
    await waitFor(() => expect(screen.getByTestId('stack-tests-board')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const btn = tools.querySelector<HTMLButtonElement>('[data-testid="header-poll-toggle-btn"]');
    expect(btn).toBeTruthy();
    btn?.click();
    btn?.click();

    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(1));
    tools.remove();
  });

  it('renders disabled modules without open links', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('matrix.json')) {
          return Promise.resolve(
            jsonResponse({
              ...MATRIX,
              backends: [{ ...MATRIX.backends[0], status: 'slot', module: undefined }],
              tests: [{ ...MATRIX.tests[0], layers: [], module: undefined, status: 'slot' }],
            }),
          );
        }
        return Promise.reject(new Error(`unexpected request: ${url}`));
      }),
    );

    renderStack();

    await waitFor(() => expect(screen.getByTestId('stack-tests-board')).toBeInTheDocument());

    const backend = screen.getByTestId('stack-backend-backend-java-spring');
    expect(backend.tagName).toBe('SPAN');
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);

    const testsRow = screen.getByTestId('stack-tests-tests-java-gradle-junit5-allure3-selenide');
    expect(testsRow.tagName).toBe('SPAN');
  });
});
