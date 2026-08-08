/// <reference types="vitest/config" />
import AllureReporter from 'allure-vitest/reporter';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts', 'allure-vitest/setup'],
    include: ['src/test/**/*.test.ts'],
    // Vitest 4 tags. Declared here because `strictTags` (default) rejects any tag
    // the config does not know about, so a typo fails the run instead of silently
    // matching nothing. Filter with `npm run test:smoke`.
    tags: [{ name: 'smoke', description: 'Page renders and talks to the API' }],
    // Reporter instance, not the `['allure-vitest/reporter', …]` string form:
    // Vitest resolves that string outside this directory and can pick up an
    // `allure-vitest` hoisted higher in the tree. That copy then injects its own
    // setup file and test runner, so two Vitest runtimes end up in one worker.
    reporters: ['default', new AllureReporter({ resultsDir: 'allure-results' })],
  },
});
