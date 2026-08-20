/// <reference types="vitest/config" />
import AllureReporter from 'allure-vitest/reporter';
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  plugins: [angular({ tsconfig: resolve(__dirname, 'tsconfig.json'), jit: true })],
  server: {
    fs: {
      allow: [__dirname],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts', 'allure-vitest/setup'],
    include: ['src/test/**/*.test.{ts,tsx}'],
    css: true,
    // Reporter instance, not the `['allure-vitest/reporter', …]` string form:
    // that specifier can resolve to an allure-vitest hoisted above this module,
    // which then injects a second Vitest runtime (setup + runner) into the worker.
    reporters: ['default', new AllureReporter({ resultsDir: 'allure-results' })],
  },
});
