import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const reactUiSrc = resolve(__dirname, '../../_shared/frontend-react-ui/src/index.ts');
const sharedRoot = resolve(__dirname, '../../_shared');

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
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
    setupFiles: ['./src/test/setup.js', 'allure-vitest/setup'],
    include: ['src/test/**/*.test.{js,jsx}'],
    css: true,
    reporters: ['default', ['allure-vitest/reporter', { resultsDir: 'allure-results' }]],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      // main.jsx / styles.js are bootstrap (createRoot, CSS imports) — nothing to assert in jsdom.
      exclude: ['src/test/**', 'src/main.jsx', 'src/styles.js'],
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
