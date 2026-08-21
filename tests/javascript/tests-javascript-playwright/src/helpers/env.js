function envBool(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  return ['1', 'true', 'yes', 'on'].includes(String(raw).trim().toLowerCase());
}

const DEFAULT_UI =
  'https://autotests.ai/stack/backend-java-spring/frontend-typescript-react';

function slash(url) {
  return `${String(url || '').replace(/\/+$/, '')}/`;
}

function uiBaseUrl() {
  return slash(process.env.UI_URL || process.env.BASE_URL || DEFAULT_UI);
}

/**
 * UI under test (origin or origin+mount). Always ends with '/' so page.goto('login')
 * resolves INSIDE the mount — goto('/login') would jump to the origin root and break
 * path-mounted deploys like /backend-java-spring/frontend-typescript-react/.
 */
const BASE_URL = uiBaseUrl();

/** API root from a UI URL (strips `/frontend-*`). No env override. */
function apiRootFrom(uiUrl) {
  const base = new URL(slash(uiUrl));
  const path = base.pathname.replace(/\/+$/, '').replace(/\/frontend-[^/]+$/, '');
  return `${base.origin}${path}`;
}

/** API root: API_BASE_URL, else the backend mount above the frontend segment. */
function apiRoot() {
  if (process.env.API_BASE_URL) {
    return String(process.env.API_BASE_URL).replace(/\/+$/, '');
  }
  return apiRootFrom(uiBaseUrl());
}

/** True when the browser landed on the SPA root — mount-aware, trailing-slash-insensitive. */
function isAppRootUrl(url) {
  const base = new URL(BASE_URL);
  const current = new URL(url);
  return (
    current.host === base.host &&
    current.pathname.replace(/\/+$/, '') === base.pathname.replace(/\/+$/, '')
  );
}

/** Maximum Allure attachments (video, HAR, screenshot, page source, console). */
function attachFull() {
  return envBool('ATTACH_FULL');
}

function attachBrowserConsoleLogs() {
  return attachFull() || envBool('ATTACH_BROWSER_CONSOLE_LOGS');
}

function attachHarLogs() {
  return attachFull() || envBool('ATTACH_HAR_LOGS') || envBool('ENABLE_HAR');
}

function attachLastScreenshot() {
  return attachFull() || envBool('ATTACH_LAST_SCREENSHOT');
}

function attachPageSource() {
  return attachFull() || envBool('ATTACH_PAGE_SOURCE');
}

function attachVideo() {
  return attachFull() || envBool('ATTACH_VIDEO') || envBool('PW_ENABLE_VIDEO');
}

module.exports = {
  envBool,
  slash,
  uiBaseUrl,
  BASE_URL,
  apiRootFrom,
  apiRoot,
  isAppRootUrl,
  attachFull,
  attachBrowserConsoleLogs,
  attachHarLogs,
  attachLastScreenshot,
  attachPageSource,
  attachVideo,
};
