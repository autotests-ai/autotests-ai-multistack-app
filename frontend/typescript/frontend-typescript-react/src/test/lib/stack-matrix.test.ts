import { describe, expect, it } from 'vitest';
import {
  parseStackQuery,
  resolveSelection,
  stackBoardHref,
} from '../../../../../_shared/stack-matrix';

describe('stack-matrix selection', () => {
  it('treats bare /stack/ as the hub and fills the CI default pair', () => {
    expect(resolveSelection('/stack/', '')).toEqual({
      hub: true,
      backendId: 'backend-java-spring',
      frontendId: 'frontend-typescript-react',
    });
  });

  it('reads hub selection from query params', () => {
    expect(
      parseStackQuery('?backend=backend-python-flask&frontend=frontend-javascript-vue'),
    ).toEqual({
      backendId: 'backend-python-flask',
      frontendId: 'frontend-javascript-vue',
    });
    expect(
      resolveSelection('/stack/', '?backend=backend-python-flask&frontend=frontend-javascript-vue'),
    ).toEqual({
      hub: true,
      backendId: 'backend-python-flask',
      frontendId: 'frontend-javascript-vue',
    });
  });

  it('keeps the path pair off the hub', () => {
    expect(resolveSelection('/stack/backend-kotlin-spring/frontend-typescript-vue/', '')).toEqual({
      hub: false,
      backendId: 'backend-kotlin-spring',
      frontendId: 'frontend-typescript-vue',
    });
  });

  it('builds a board href that stays on /stack/', () => {
    expect(stackBoardHref('backend-python-flask', 'frontend-javascript-vue')).toBe(
      '/stack/?backend=backend-python-flask&frontend=frontend-javascript-vue',
    );
  });
});
