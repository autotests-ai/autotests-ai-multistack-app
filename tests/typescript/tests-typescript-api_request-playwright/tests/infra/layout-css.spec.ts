import { expect, test } from '@playwright/test';
import { gridColumnCount } from '../../src/helpers/layout-css';

test.describe('LayoutCss', { tag: ['@infra', '@infra_frontend'] }, () => {
  const cases: Array<[string | null, number]> = [
    ['repeat(3, minmax(0, 1fr))', 3],
    ['603px 603px', 2],
    ['1fr', 1],
    ['316px', 1],
    ['none', 0],
    [null, 0],
    ['', 0],
    ['   ', 0],
  ];

  for (const [value, expected] of cases) {
    test(`gridColumnCount parses ${JSON.stringify(value)}`, () => {
      expect(gridColumnCount(value)).toBe(expected);
    });
  }
});
