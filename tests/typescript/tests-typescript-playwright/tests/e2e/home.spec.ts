import { expect } from '@playwright/test';
import { test } from '../../src/helpers/fixtures/fixture';

const API_HEALTH_SERVICE = process.env.API_HEALTH_SERVICE || 'backend-java-spring';

test.describe('Home', { tag: ['@e2e'] }, () => {
  test('Home загружает health и items', { tag: ['@crystal'] }, async ({ webApp }) => {
    await webApp.home.open();
    await expect(webApp.home.healthStatus).toContainText(`service: ${API_HEALTH_SERVICE}`);
    await expect(webApp.home.itemsList).toContainText('Alpha');
  });
});
