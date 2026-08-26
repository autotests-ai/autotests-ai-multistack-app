import dotenv from 'dotenv';
import path from 'path';

if (!process.env.CI) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

export function envBool(name: string, defaultValue = false): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  return ['1', 'true', 'yes', 'on'].includes(String(raw).trim().toLowerCase());
}

const DEFAULT_UI =
  'https://autotests.ai/stack/backend-java-spring/frontend-typescript-react';

export function slash(url: string): string {
  return `${String(url || '').replace(/\/+$/, '')}/`;
}

export function uiBaseUrl(): string {
  return slash(process.env.UI_URL || process.env.BASE_URL || DEFAULT_UI);
}

/**
 * UI under test (origin or origin+mount). Always ends with '/' so page.goto('login')
 * resolves INSIDE the mount — goto('/login') would jump to the origin root and break
 * path-mounted deploys like /backend-java-spring/frontend-typescript-react/.
 */
export const BASE_URL = uiBaseUrl();

/** API root from a UI URL (strips `/frontend-*`). No env override. */
export function apiRootFrom(uiUrl: string): string {
  const base = new URL(slash(uiUrl));
  const path = base.pathname.replace(/\/+$/, '').replace(/\/frontend-[^/]+$/, '');
  return `${base.origin}${path}`;
}

/** API root: API_BASE_URL, else the backend mount above the frontend segment. */
export function apiRoot(): string {
  if (process.env.API_BASE_URL) {
    return String(process.env.API_BASE_URL).replace(/\/+$/, '');
  }
  return apiRootFrom(uiBaseUrl());
}

/** True when the browser landed on the SPA root — mount-aware, trailing-slash-insensitive. */
export function isAppRootUrl(url: URL | string): boolean {
  const base = new URL(BASE_URL);
  const current = url instanceof URL ? url : new URL(url);
  return (
    current.host === base.host &&
    current.pathname.replace(/\/+$/, '') === base.pathname.replace(/\/+$/, '')
  );
}

/** Maximum Allure attachments (video, HAR, screenshot, page source, console). */
export function attachFull(): boolean {
  return envBool('ATTACH_FULL');
}

export function attachBrowserConsoleLogs(): boolean {
  return attachFull() || envBool('ATTACH_BROWSER_CONSOLE_LOGS');
}

export function attachHarLogs(): boolean {
  return attachFull() || envBool('ATTACH_HAR_LOGS') || envBool('ENABLE_HAR');
}

export function attachLastScreenshot(): boolean {
  return attachFull() || envBool('ATTACH_LAST_SCREENSHOT');
}

export function attachPageSource(): boolean {
  return attachFull() || envBool('ATTACH_PAGE_SOURCE');
}

export function attachVideo(): boolean {
  return attachFull() || envBool('ATTACH_VIDEO') || envBool('PW_ENABLE_VIDEO');
}
