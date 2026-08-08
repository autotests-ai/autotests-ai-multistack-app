/// <reference types="vitest/config" />

import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import AllureReporter from 'allure-vitest/reporter';
import { defineConfig } from 'vite';

const reactUiSrc = resolve(__dirname, '../../_shared/frontend-react-ui/src/index.ts');
const sharedRoot = resolve(__dirname, '../../_shared');

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    // The library alias points outside this package, so its `react` import would
    // otherwise resolve against a copy hoisted higher in the tree — two Reacts in
    // one render tree, which fails as "Invalid hook call".
    dedupe: ['react', 'react-dom'],
    alias: {
      '@zero-design-system/react': reactUiSrc,
    },
  },
  server: {
    fs: {
      allow: [__dirname, sharedRoot],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts', 'allure-vitest/setup'],
    include: ['src/test/**/*.test.{ts,tsx}'],
    // Vitest 4 tags. Declared here because `strictTags` (default) rejects any tag
    // the config does not know about, so a typo fails the run instead of silently
    // matching nothing. Filter with `npm run test:smoke`.
    tags: [{ name: 'smoke', description: 'App shell mounts and the routes resolve' }],
    css: true,
    // Reporter instance, not the `['allure-vitest/reporter', …]` string form:
    // that specifier can resolve to an allure-vitest hoisted above this module,
    // which then injects a second Vitest runtime (setup + runner) into the worker.
    reporters: ['default', new AllureReporter({ resultsDir: 'allure-results' })],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      // main.tsx / styles.ts are bootstrap (createRoot, CSS imports) — nothing to assert in jsdom.
      exclude: ['src/test/**', 'src/**/*.d.ts', 'src/main.tsx', 'src/styles.ts'],
      // Regression floor, not a target: raise when coverage grows, never lower silently.
      thresholds: {
        lines: 92,
        statements: 92,
        branches: 82,
        functions: 95,
      },
    },
  },
});
