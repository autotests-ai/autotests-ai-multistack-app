/// <reference types="vitest/config" />

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
    setupFiles: ['./src/test/setup.ts', 'allure-vitest/setup'],
    include: ['src/test/**/*.test.{ts,tsx}'],
    css: true,
    reporters: ['default', ['allure-vitest/reporter', { resultsDir: 'allure-results' }]],
  },
});
