const fs = require('fs');
const path = require('path');

const MODULE_ROOT = path.resolve(__dirname, '../..');
const APP_ROOT = path.resolve(MODULE_ROOT, '../../..');
const ROOT_BLOCK = /:root\s*\{([^}]+)\}/s;
const TOKEN = /(--[\w-]+)\s*:\s*([^;]+);/g;

function defaultTokensPath() {
  return resolveFromAppRoot(APP_ROOT);
}

function resolveFromAppRoot(appRoot) {
  return firstExisting(tokensCssCandidates(appRoot));
}

function firstExisting(candidates) {
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

function parseRootTokens(cssFile) {
  const css = fs.readFileSync(cssFile, 'utf8');
  const match = css.match(ROOT_BLOCK);
  if (!match) {
    throw new Error(`:root block not found in ${cssFile}`);
  }
  const tokens = {};
  for (const tokenMatch of match[1].matchAll(TOKEN)) {
    tokens[tokenMatch[1]] = tokenMatch[2].trim();
  }
  return tokens;
}

function tokensCssCandidates(appRoot) {
  const candidates = [hubTokens(appRoot)];
  appendVendorTokens(path.join(appRoot, 'frontend'), candidates);
  return candidates;
}

function hubTokens(appRoot) {
  return path.join(appRoot, 'frontend', '_shared', 'frontend-javascript-app', 'css', 'tokens.css');
}

function appendVendorTokens(frontendRoot, out) {
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

function isProductLanguageDir(name) {
  return !name.startsWith('.') && !name.startsWith('_') && name !== 'scripts' && name !== 'node_modules';
}

module.exports = {
  defaultTokensPath,
  resolveFromAppRoot,
  firstExisting,
  parseRootTokens,
};
