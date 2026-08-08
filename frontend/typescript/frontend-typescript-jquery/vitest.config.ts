/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['allure-vitest/setup'],
    include: ['src/test/**/*.test.ts'],
    restoreMocks: true,
    reporters: ['default', ['allure-vitest/reporter', { resultsDir: 'allure-results' }]],
  },
});
