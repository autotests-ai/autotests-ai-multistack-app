import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import AllureReporter from 'allure-vitest/reporter';
import { defineConfig } from 'vite';

const reactUiSrc = resolve(__dirname, 'vendor/react-ui/src/index.ts');

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    // vendor/react-ui imports `react` by name — keep this package's copy so the
    // alias does not pick up a second React higher in the tree ("Invalid hook call").
    dedupe: ['react', 'react-dom'],
    alias: {
      '@zero-design-system/react': reactUiSrc,
    },
  },
  server: {
    fs: {
      allow: [__dirname],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js', 'allure-vitest/setup'],
    include: ['src/test/**/*.test.{js,jsx}'],
    css: true,
    // Reporter instance, not the `['allure-vitest/reporter', …]` string form:
    // that specifier can resolve to an allure-vitest hoisted above this module,
    // which then injects a second Vitest runtime (setup + runner) into the worker.
    reporters: ['default', new AllureReporter({ resultsDir: 'allure-results' })],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      // main.jsx / styles.js are bootstrap (createRoot, CSS imports) — nothing to assert in jsdom.
      exclude: ['src/test/**', 'src/main.jsx', 'src/styles.js', 'vendor/**'],
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
