const fs = require('fs');
const { test: base } = require('@playwright/test');
const { label } = require('allure-js-commons');
const { App } = require('../../pages/app');
const {
  BASE_URL,
  attachBrowserConsoleLogs,
  attachHarLogs,
  attachLastScreenshot,
  attachPageSource,
  attachVideo,
  attachFull,
} = require('../env');
const Attachments = require('../attachments');
const { pageSourceQuiet, screenshotQuiet } = require('../quiet-page');
const { createHarCollector } = require('../har-collect');

async function applyAllureLayer(testInfo) {
  const tags = testInfo.tags || [];
  const has = (tag) => tags.includes(tag);
  if (has('@api')) {
    await label('layer', 'api');
  } else if (has('@manual')) {
    await label('layer', 'manual');
  } else if (has('@infra') || has('@infra_backend') || has('@infra_frontend')) {
    await label('layer', 'infra');
  } else if (has('@ui')) {
    await label('layer', 'ui');
  } else if (has('@e2e')) {
    await label('layer', 'e2e');
  }
}

function wantAnyAttachments() {
  return (
    attachFull() ||
    attachBrowserConsoleLogs() ||
    attachHarLogs() ||
    attachLastScreenshot() ||
    attachPageSource() ||
    attachVideo()
  );
}

/**
 * Full-attachments: one teardown block on context fixture (Allure single list).
 * Page close is deferred so screenshot/page source run before context.close();
 * video is attached after close via recordVideo + saveAs.
 */
const test = base.extend({
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    if (!wantAnyAttachments()) {
      await page.close();
    }
  },

  context: async ({ browser }, use, testInfo) => {
    const contextOptions = { baseURL: BASE_URL };
    if (attachVideo()) {
      contextOptions.recordVideo = { dir: testInfo.outputPath('videos') };
    }
    const context = await browser.newContext(contextOptions);
    await use(context);

    if (!wantAnyAttachments()) {
      await context.close();
      return;
    }

    const page = context.pages()[0];
    const logs = testInfo._zdsConsoleLogs || [];
    try {
      if (page) {
        if (attachBrowserConsoleLogs()) {
          await Attachments.browserConsoleLogs(logs);
        }
        if (attachPageSource()) {
          await Attachments.pageSource(await pageSourceQuiet(page));
        }
        if (attachLastScreenshot()) {
          await Attachments.lastScreenshot(await screenshotQuiet(page));
        }
        if (attachHarLogs() && testInfo._zdsHar) {
          const bytes = testInfo._zdsHar.toHarBytes();
          const harPath = testInfo.outputPath('capture.har');
          fs.writeFileSync(harPath, bytes);
          await Attachments.harLogs(harPath);
        }
      }
    } catch (err) {
      console.warn('full-attachments:', err.message || err);
    }

    const video = page?.video();
    await context.close();

    if (attachVideo() && video) {
      try {
        const savedPath = testInfo.outputPath('video.webm');
        await video.saveAs(savedPath);
        if (!(await Attachments.videoFile(savedPath))) {
          await Attachments.videoLink();
        }
      } catch (err) {
        console.warn('video attach:', err.message || err);
        await Attachments.videoLink();
      }
    }
  },

  webApp: async ({ page }, use, testInfo) => {
    await applyAllureLayer(testInfo);
    const app = new App(page);
    await use(app);
  },

  _artifactCapture: [
    async ({ page }, use, testInfo) => {
      const logs = [];
      testInfo._zdsConsoleLogs = logs;
      if (attachBrowserConsoleLogs()) {
        page.on('console', (msg) => {
          logs.push(`${msg.type()}: ${msg.text()}`);
        });
        page.on('pageerror', (err) => {
          logs.push(`pageerror: ${err.message}`);
        });
        page.on('requestfailed', (req) => {
          const failure = req.failure();
          logs.push(
            `requestfailed: ${req.url()} — ${failure ? failure.errorText : 'failed'}`,
          );
        });
        page.on('response', (resp) => {
          const status = resp.status();
          if (status >= 400) {
            logs.push(`response: ${status} ${resp.url()}`);
          }
        });
      }
      let har = null;
      if (attachHarLogs()) {
        har = createHarCollector();
        testInfo._zdsHar = har;
        await har.start(page);
      }
      await use();
      if (har) {
        await har.stop();
      }
    },
    { auto: true },
  ],
});

exports.test = test;
