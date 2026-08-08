import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js', 'allure-vitest/setup'],
    include: ['src/test/**/*.test.js'],
    reporters: ['default', ['allure-vitest/reporter', { resultsDir: 'allure-results' }]],
  },
});
