/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts', 'allure-vitest/setup'],
    include: ['src/test/**/*.test.ts'],
    reporters: ['default', ['allure-vitest/reporter', { resultsDir: 'allure-results' }]],
  },
});
