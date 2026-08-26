// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import type { Locator } from '@playwright/test';

const ROOT = path.resolve(__dirname, '../..');

function standFolder() {
  const key = (process.env.STAND || process.env.ENV || '').trim();
  if (key === 'mock') return 'mock';
  if (key === 'stage') return 'stage';
  if (key === 'prod' || key === 'ci' || key === '') return 'prod';
  throw new Error(`screenshot folder: unknown env '${key}' (use mock, stage, prod, or ci)`);
}

function mapOs(raw) {
  const v = String(raw || '').toLowerCase();
  if (v === 'darwin' || v === 'macos' || v === 'osx') return 'macos';
  if (v === 'win32' || v === 'windows' || v === 'win') return 'windows';
  if (v === 'linux') return 'linux';
  return v || 'linux';
}

function screenshotOs() {
  const override = (process.env.SCREENSHOT_OS || '').trim();
  return mapOs(override || process.platform);
}

function pinnedChromeVersion() {
  const override = (process.env.CHROME_FOR_TESTING_VERSION || '').trim();
  if (override) return override;
  const pin = path.join(ROOT, 'chrome-for-testing.properties');
  const text = fs.readFileSync(pin, 'utf8');
  for (const line of text.split('\n')) {
    const stripped = line.trim();
    if (stripped.startsWith('version=')) {
      const value = stripped.slice('version='.length).trim();
      if (value) return value;
    }
  }
  throw new Error('No version= entry in chrome-for-testing.properties');
}

function screenshotBrowserFolder() {
  const browser = ((process.env.SCREENSHOT_BROWSER || 'chrome').trim() || 'chrome').toLowerCase();
  const major = pinnedChromeVersion().split('.', 1)[0];
  return `${browser}-${major}`;
}

function screenshotFilePath(area, viewport) {
  return path.join(
    ROOT,
    'src',
    'test',
    'resources',
    'screenshots',
    standFolder(),
    screenshotOs(),
    screenshotBrowserFolder(),
    area,
    `${viewport}.png`,
  );
}

function shouldUpdate() {
  const raw = (process.env.UPDATE_SCREENSHOTS || '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(raw);
}

async function captureAndCompare(locator, area, viewport, attachmentName) {
  await locator.evaluate(() =>
    Promise.all([
      document.fonts.ready,
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
    ]),
  );
  const actual = await locator.screenshot({ type: 'png' });
  const filePath = screenshotFilePath(area, viewport);
  const label = `${area}/${viewport}`;
  const present = fs.existsSync(filePath);

  if (shouldUpdate()) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, actual);
    return;
  }

  if (!present) {
    const rel = path.relative(ROOT, filePath);
    throw new Error(
      `Screenshot missing for ${label}. Commit PNG to ${rel} or run with UPDATE_SCREENSHOTS=true`,
    );
  }

  const expected = fs.readFileSync(filePath);
  const exp = PNG.sync.read(expected);
  const act = PNG.sync.read(actual);
  if (exp.width !== act.width || exp.height !== act.height) {
    throw new Error(
      `Screenshot size changed for ${label}: expected ${exp.width}x${exp.height}, actual ${act.width}x${act.height}`,
    );
  }
  const diff = new PNG({ width: exp.width, height: exp.height });
  const mismatched = pixelmatch(exp.data, act.data, diff.data, exp.width, exp.height, {
    threshold: 0,
  });
  if (mismatched > 0) {
    const diffDir = path.join(ROOT, 'build', 'screenshot-diff');
    fs.mkdirSync(diffDir, { recursive: true });
    fs.writeFileSync(path.join(diffDir, `${attachmentName}-diff.png`), PNG.sync.write(diff));
    throw new Error(`Screenshot mismatch for ${label}: ${mismatched} pixels (${attachmentName})`);
  }
}

export { captureAndCompare, screenshotFilePath, standFolder, screenshotOs };
