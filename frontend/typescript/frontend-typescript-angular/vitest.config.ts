/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'node:path';

const sharedRoot = resolve(__dirname, '../../_shared');

export default defineConfig({
  base: './',
  plugins: [angular({ tsconfig: resolve(__dirname, 'tsconfig.json'), jit: true })],
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
