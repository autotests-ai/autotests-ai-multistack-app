import fs from 'fs';
import { test as base } from '@playwright/test';
import type { TestInfo } from '@playwright/test';
import { App } from '../../pages/app';
import {
  BASE_URL,
  attachBrowserConsoleLogs,
  attachHarLogs,
  attachLastScreenshot,
  attachPageSource,
  attachVideo,
  attachFull,
} from '../env';
import * as Attachments from '../attachments';
import { pageSourceQuiet, screenshotQuiet } from '../quiet-page';
import { createHarCollector } from '../har-collect';

type ZdsTestInfo = TestInfo & {
  _zdsConsoleLogs?: string[];
  _zdsHar?: ReturnType<typeof createHarCollector>;
};

function wantAnyAttachments(): boolean {
  return (
    attachFull() ||
    attachBrowserConsoleLogs() ||
    attachHarLogs() ||
    attachLastScreenshot() ||
    attachPageSource() ||
    attachVideo()
  );
}

export const test = base.extend<{ webApp: App; _artifactCapture: undefined }>({
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    if (!wantAnyAttachments()) {
      await page.close();
    }
  },

  context: async ({ browser }, use, testInfo) => {
    const info = testInfo as ZdsTestInfo;
    const contextOptions: Parameters<typeof browser.newContext>[0] = { baseURL: BASE_URL };
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
    const logs = info._zdsConsoleLogs || [];
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
        if (attachHarLogs() && info._zdsHar) {
          const bytes = info._zdsHar.toHarBytes();
          const harPath = testInfo.outputPath('capture.har');
          fs.writeFileSync(harPath, bytes);
          await Attachments.harLogs(harPath);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('full-attachments:', message);
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
        const message = err instanceof Error ? err.message : String(err);
        console.warn('video attach:', message);
        await Attachments.videoLink();
      }
    }
  },

  webApp: async ({ page }, use) => {
    const app = new App(page);
    await use(app);
  },

  _artifactCapture: [
    async ({ page }, use, testInfo) => {
      const info = testInfo as ZdsTestInfo;
      const logs: string[] = [];
      info._zdsConsoleLogs = logs;
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
      let har: ReturnType<typeof createHarCollector> | null = null;
      if (attachHarLogs()) {
        har = createHarCollector();
        info._zdsHar = har;
        await har.start(page);
      }
      await use(undefined);
      if (har) {
        await har.stop();
      }
    },
    { auto: true },
  ],
});
