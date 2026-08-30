const { expect } = require('@playwright/test');
const { test } = require('../../src/helpers/fixtures/fixture');

test.describe('Home layout', { tag: ['@ui', '@mock'] }, () => {
  test('Home shows embedded header and reference layout', async ({ webApp }) => {
    await webApp.home.open();
    await expect(webApp.home.header).toBeVisible();
    await webApp.home.shouldShowLayout();
  });
});
