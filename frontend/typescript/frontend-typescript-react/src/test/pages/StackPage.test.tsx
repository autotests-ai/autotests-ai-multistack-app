import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

  it('shows matrix load error when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({}, false, 404))),
    );

    renderStack();

    await waitFor(() => expect(screen.getByTestId('stack-error')).toBeInTheDocument());
    expect(screen.getByTestId('stack-error')).toHaveTextContent('matrix.json');
  });
});
