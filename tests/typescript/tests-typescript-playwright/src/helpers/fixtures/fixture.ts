import { test as base } from '@playwright/test';
import { App } from '../../pages/app';

export const test = base.extend<{ webApp: App }>({
  webApp: async ({ page }, use) => {
    const app = new App(page);
    await use(app);
  },
});
