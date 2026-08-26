import { expect, test } from '@playwright/test';
import { createHarCollector } from '../../src/helpers/har-collect';

test.describe('HAR capture', { tag: ['@harness', '@harness_frontend'] }, () => {
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

  test('start/stop against a blank page produces HAR bytes', async ({ page }) => {
    const har = createHarCollector();
    await har.start(page);
    await page.goto('about:blank');
    await har.stop();
    const parsed = JSON.parse(har.toHarBytes().toString('utf8'));
    expect(parsed.log.version).toBe('1.2');
    expect(Array.isArray(parsed.log.entries)).toBeTruthy();
  });
});
