function envBool(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  return ['1', 'true', 'yes', 'on'].includes(String(raw).trim().toLowerCase());
}

/**
 * UI under test (origin or origin+mount). Always ends with '/' so page.goto('login')
 * resolves INSIDE the mount — goto('/login') would jump to the origin root and break
 * path-mounted deploys like /backend-java-spring/frontend-typescript-react/.
 */
const BASE_URL = `${(
  process.env.UI_URL ||
  'https://autotests.ai/stack/backend-java-spring/frontend-typescript-react'
).replace(/\/+$/, '')}/`;

/** API root: the backend mount above the frontend segment (or the origin on root deploys). */
function apiRoot() {
  const base = new URL(BASE_URL);
  const path = base.pathname.replace(/\/+$/, '').replace(/\/frontend-[^/]+$/, '');
  return `${base.origin}${path}`;
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
  BASE_URL,
  apiRoot,
  isAppRootUrl,
  attachFull,
  attachBrowserConsoleLogs,
  attachHarLogs,
  attachLastScreenshot,
  attachPageSource,
  attachVideo,
};
