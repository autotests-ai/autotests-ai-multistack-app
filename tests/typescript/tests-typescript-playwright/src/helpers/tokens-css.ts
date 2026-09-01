// @ts-nocheck
import fs from 'fs';
import path from 'path';

const MODULE_ROOT = path.resolve(__dirname, '../..');
const APP_ROOT = path.resolve(MODULE_ROOT, '../../..');
const ROOT_BLOCK = /:root\s*\{([^}]+)\}/s;
const TOKEN = /(--[\w-]+)\s*:\s*([^;]+);/g;

export function defaultTokensPath() {
  return resolveFromAppRoot(APP_ROOT);
}

export function resolveFromAppRoot(appRoot: string) {
  return firstExisting(tokensCssCandidates(appRoot));
}

export function firstExisting(candidates: string[]) {
  let fallback = path.resolve(candidates[candidates.length - 1]);
  for (const candidate of candidates) {
    const abs = path.resolve(candidate);
    if (fs.existsSync(abs)) {
      return abs;
    }
    fallback = abs;
  }
  return fallback;
}

export function parseRootTokens(cssFile: string) {
  const css = fs.readFileSync(cssFile, 'utf8');
  const match = css.match(ROOT_BLOCK);
  if (!match) {
    throw new Error(`:root block not found in ${cssFile}`);
  }
  const tokens: Record<string, string> = {};
  for (const tokenMatch of match[1].matchAll(TOKEN)) {
    tokens[tokenMatch[1]] = tokenMatch[2].trim();
  }
  return tokens;
}

function tokensCssCandidates(appRoot: string) {
  const candidates = [hubTokens(appRoot)];
  appendVendorTokens(path.join(appRoot, 'frontend'), candidates);
  return candidates;
}

function hubTokens(appRoot: string) {
  return path.join(appRoot, 'frontend', '_shared', 'frontend-javascript-app', 'css', 'tokens.css');
}

function appendVendorTokens(frontendRoot: string, out: string[]) {
  if (!fs.existsSync(frontendRoot)) {
    return;
  }
  const langs = fs
    .readdirSync(frontendRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const lang of langs) {
    if (!isProductLanguageDir(lang)) {
      continue;
    }
    const langDir = path.join(frontendRoot, lang);
    const cells = fs
      .readdirSync(langDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    for (const cell of cells) {
      if (cell.startsWith('.')) {
        continue;
      }
      const cellDir = path.join(langDir, cell);
      out.push(path.join(cellDir, 'vendor', 'ds', 'css', 'tokens.css'));
      out.push(path.join(cellDir, 'vendor', 'frontend-javascript-app', 'css', 'tokens.css'));
    }
  }
}

function isProductLanguageDir(name: string) {
  return !name.startsWith('.') && !name.startsWith('_') && name !== 'scripts' && name !== 'node_modules';
}
