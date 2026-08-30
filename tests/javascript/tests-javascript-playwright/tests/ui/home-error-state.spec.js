const { expect } = require('@playwright/test');
const { test } = require('../../src/helpers/fixtures/fixture');
const mock = require('../../src/helpers/mock-scenarios');

test.describe('Home error states', { tag: ['@ui', '@mock'] }, () => {
  test.beforeEach(async () => {
    test.skip(!(await mock.available()), 'WireMock admin API is not exposed on this stand');
  });

  test.afterEach(async () => {
    await mock.resetAll();
  });

  test('Items API failure shows a readable error, not a blank page', async ({ webApp }) => {
    await mock.setState('items', 'error');
    await webApp.home.open();
    await expect(webApp.home.itemsList).toContainText('✗ items: HTTP 500');
  });

  test('Health API failure shows a readable error in the health panel', async ({ webApp }) => {
    await mock.setState('health', 'error');
    await webApp.home.open();
    await expect(webApp.home.healthStatus).toContainText('✗ health: HTTP 500');
  });
});
