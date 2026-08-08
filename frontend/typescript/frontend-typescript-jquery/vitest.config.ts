/// <reference types="vitest/config" />
import AllureReporter from 'allure-vitest/reporter';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['allure-vitest/setup'],
    include: ['src/test/**/*.test.ts'],
    restoreMocks: true,
    // Reporter instance, not the `['allure-vitest/reporter', …]` string form:
    // that specifier can resolve to an allure-vitest hoisted above this module,
    // which then injects a second Vitest runtime (setup + runner) into the worker.
    reporters: ['default', new AllureReporter({ resultsDir: 'allure-results' })],
  },
});
