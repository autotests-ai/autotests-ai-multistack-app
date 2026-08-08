/// <reference types="vitest/config" />
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import AllureReporter from 'allure-vitest/reporter';
import { defineConfig } from 'vite';
import { angularDecorators } from './babel-decorators.js';

const moduleDir = dirname(fileURLToPath(import.meta.url));
const sharedRoot = resolve(moduleDir, '../../_shared');

export default defineConfig({
  base: './',
  // Same Babel pass as the production build — TestBed compiles the very same
  // decorator metadata the browser bundle does.
  plugins: [angularDecorators()],
  server: {
    fs: {
      allow: [moduleDir, sharedRoot],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js', 'allure-vitest/setup'],
    include: ['src/test/**/*.test.js'],
    css: true,
    // Reporter instance, not the `['allure-vitest/reporter', …]` string form:
    // that specifier can resolve to an allure-vitest hoisted above this module,
    // which then injects a second Vitest runtime (setup + runner) into the worker.
    reporters: ['default', new AllureReporter({ resultsDir: 'allure-results' })],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.js'],
      // main.js / styles.js are bootstrap (bootstrapApplication, CSS imports) —
      // nothing to assert in jsdom.
      exclude: ['src/test/**', 'src/main.js', 'src/styles.js'],
      // Regression floor, not a target: raise when coverage grows, never lower silently.
      thresholds: {
        lines: 96,
        statements: 96,
        branches: 80,
        functions: 95,
      },
    },
  },
});
