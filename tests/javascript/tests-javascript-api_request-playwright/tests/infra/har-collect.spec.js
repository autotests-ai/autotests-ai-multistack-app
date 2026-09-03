const { test, expect } = require('@playwright/test');
const { createHarCollector } = require('../../src/helpers/har-collect');

test.describe('HAR capture', { tag: ['@infra', '@infra_frontend'] }, () => {
  test('createHarCollector exposes start/stop/toHarBytes', () => {
    const har = createHarCollector();
    expect(typeof har.start).toBe('function');
    expect(typeof har.stop).toBe('function');
    expect(typeof har.toHarBytes).toBe('function');
    const bytes = har.toHarBytes();
    const parsed = JSON.parse(bytes.toString('utf8'));
    expect(parsed.log.creator.name).toBeTruthy();
    expect(Array.isArray(parsed.log.entries)).toBeTruthy();
  });
});
