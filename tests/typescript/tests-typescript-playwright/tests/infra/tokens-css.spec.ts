import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect, test } from '@playwright/test';
import {
  defaultTokensPath,
  firstExisting,
  parseRootTokens,
  resolveFromAppRoot,
} from '../../src/helpers/tokens-css';

function writeTokens(file: string): string {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, ':root { --x: 1px; }');
  return file;
}

test.describe('TokensCss', { tag: ['@infra', '@infra_frontend'] }, () => {
  const cases: Array<[string, string]> = [
    ['--control-height-md', '36px'],
    ['--icon-size-md', '18px'],
    ['--input-min-width', '200px'],
    ['--header-height', '40px'],
  ];

  for (const [token, expected] of cases) {
    test(`tokens.css keeps canonical ${token}`, () => {
      const tokens = parseRootTokens(defaultTokensPath());
      expect(tokens, `Missing token: ${token}`).toHaveProperty(token);
      expect(tokens[token]).toBe(expected);
    });
  }

  test('defaultTokensPath resolves an existing tokens.css', () => {
    expect(fs.existsSync(defaultTokensPath())).toBeTruthy();
  });

  test('firstExisting returns the first path that exists', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-css-'));
    const missing = path.join(temp, 'missing.css');
    const hit = path.join(temp, 'hit.css');
    const later = path.join(temp, 'later.css');
    fs.writeFileSync(hit, ':root { --x: 1px; }');
    fs.writeFileSync(later, ':root { --y: 2px; }');
    expect(firstExisting([missing, hit, later])).toBe(path.resolve(hit));
  });

  test('firstExisting returns the last path when none exist', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-css-'));
    const missing = path.join(temp, 'missing.css');
    const fallback = path.join(temp, 'fallback.css');
    expect(firstExisting([missing, fallback])).toBe(path.resolve(fallback));
  });

  test('resolveFromAppRoot prefers the frontend hub over any vendor copy', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-css-'));
    const hub = writeTokens(
      path.join(temp, 'frontend', '_shared', 'frontend-javascript-app', 'css', 'tokens.css'),
    );
    writeTokens(
      path.join(
        temp,
        'frontend',
        'javascript',
        'frontend-javascript-vue',
        'vendor',
        'ds',
        'css',
        'tokens.css',
      ),
    );
    expect(resolveFromAppRoot(temp)).toBe(path.resolve(hub));
  });

  test('resolveFromAppRoot finds vendor/ds on javascript-vue when hub is missing', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-css-'));
    const vue = writeTokens(
      path.join(
        temp,
        'frontend',
        'javascript',
        'frontend-javascript-vue',
        'vendor',
        'ds',
        'css',
        'tokens.css',
      ),
    );
    expect(resolveFromAppRoot(temp)).toBe(path.resolve(vue));
  });

  test('resolveFromAppRoot ignores scripts/.github/node_modules and uses a product cell', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-css-'));
    writeTokens(path.join(temp, 'frontend', 'scripts', 'not-a-cell', 'vendor', 'ds', 'css', 'tokens.css'));
    writeTokens(path.join(temp, 'frontend', '.github', 'workflows', 'vendor', 'ds', 'css', 'tokens.css'));
    writeTokens(path.join(temp, 'frontend', 'node_modules', 'pkg', 'vendor', 'ds', 'css', 'tokens.css'));
    writeTokens(path.join(temp, 'frontend', 'javascript', '.github', 'vendor', 'ds', 'css', 'tokens.css'));
    const vue = writeTokens(
      path.join(
        temp,
        'frontend',
        'javascript',
        'frontend-javascript-vue',
        'vendor',
        'ds',
        'css',
        'tokens.css',
      ),
    );
    expect(resolveFromAppRoot(temp)).toBe(path.resolve(vue));
  });

  test('resolveFromAppRoot falls back to vendor/frontend-javascript-app when vendor/ds is missing', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-css-'));
    const baked = writeTokens(
      path.join(
        temp,
        'frontend',
        'javascript',
        'frontend-javascript-vue',
        'vendor',
        'frontend-javascript-app',
        'css',
        'tokens.css',
      ),
    );
    expect(resolveFromAppRoot(temp)).toBe(path.resolve(baked));
  });

  test('resolveFromAppRoot falls back to hub path when frontend tree is missing', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-css-'));
    const hub = path.join(temp, 'frontend', '_shared', 'frontend-javascript-app', 'css', 'tokens.css');
    expect(resolveFromAppRoot(temp)).toBe(path.resolve(hub));
  });

  test('parseRootTokens rejects css without :root block', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tokens-css-'));
    const css = path.join(temp, 'tokens-invalid.css');
    fs.writeFileSync(css, 'body { color: red; }');
    expect(() => parseRootTokens(css)).toThrow(':root block not found');
  });
});
