// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');
const { envBool, attachFull, attachVideo } = require('./src/helpers/env');

if (!process.env.CI) {
  dotenv.config({ path: path.resolve(__dirname, '.env') });
}

/**
 * When SELENOID_PLAYWRIGHT_URL is set, connect to Selenoid Playwright.
 * Otherwise launch local Chromium.
 *
 * Video: Playwright recordVideo → Allure mp4 attachment (primary).
 * Fallback: PW_VIDEO_NAME on WS query → Selenoid hub URL in HTML player.
 */
function remoteConnectOptions() {
  const ws = process.env.SELENOID_PLAYWRIGHT_URL;
  if (!ws) {
    return undefined;
  }
  const enableVideo =
    attachVideo() || envBool('PW_ENABLE_VIDEO') || attachFull() ? 'true' : 'false';
  const enableVnc =
    envBool('PW_ENABLE_VNC') || attachFull() ? 'true' : 'false';
  const options = {
    name: process.env.PW_SESSION_NAME || 'autotests-ai-multistack-js',
    sessionTimeout: process.env.PW_SESSION_TIMEOUT || '5m',
    enableVNC: enableVnc,
    enableVideo,
  };
  if (enableVideo === 'true') {
    options.screenResolution =
      process.env.PW_SCREEN_RESOLUTION || '1920x1080x24';
    const videoName =
      process.env.PW_VIDEO_NAME ||
      `autotests-ai-multistack-js-${Date.now()}.mp4`;
    process.env.PW_VIDEO_NAME = videoName;
    options.videoName = videoName;
  }
  const endpoint = ws.includes('?')
    ? `${ws}&${new URLSearchParams(options)}`
    : `${ws}?${new URLSearchParams(options)}`;
  return { wsEndpoint: endpoint };
}

const connectOptions = remoteConnectOptions();

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['line'],
    ['allure-playwright', { resultsDir: process.env.ALLURE_RESULTS || 'allure-results' }],
  ],
  use: {
    baseURL: process.env.UI_URL || 'https://autotests.ai/stack/backend-java-spring/frontend-typescript-react',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    ...(connectOptions ? { connectOptions } : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
