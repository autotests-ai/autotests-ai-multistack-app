const fs = require('fs');
const path = require('path');
const { expect, test } = require('@playwright/test');

test.describe('Chrome for Testing pin', { tag: ['@infra', '@infra_frontend'] }, () => {
  test('pinnedVersion is a full Chrome for Testing build number', () => {
    const raw = fs.readFileSync(
      path.resolve(__dirname, '../../chrome-for-testing.properties'),
      'utf8',
    );
    const match = raw.match(/^version=(.+)$/m);
    expect(match?.[1].trim()).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
  });
});
