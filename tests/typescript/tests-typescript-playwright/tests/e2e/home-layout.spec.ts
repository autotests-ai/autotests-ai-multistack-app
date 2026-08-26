import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';

test.describe('Home layout', { tag: ['@e2e', '@mock'] }, () => {
  test('Home shows embedded header and reference layout', async ({ webApp }) => {
    await webApp.home.open();
    await expect(webApp.home.header).toBeVisible();
    await expect(webApp.home.layout).toBeVisible();
    await expect(webApp.home.itemsList).toBeVisible();
  });
});
