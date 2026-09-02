import AllureReporter from 'allure-vitest/reporter';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./setup.js', 'allure-vitest/setup'],
    include: ['tests/**/*.spec.js'],
    testTimeout: 15_000,
    tags: [
      { name: 'api', description: 'HTTP contract against a live stand (LAYERS.md)' },
      { name: 'manual', description: 'exploratory stubs in code' },
      { name: 'infra', description: 'tests-module helpers (not a pyramid layer)' },
      { name: 'infra_backend', description: 'ConfigReader analog' },
      { name: 'smoke', description: 'smoke scenarios' },
      { name: 'positive', description: 'happy path' },
      { name: 'negative', description: 'validation / error paths' },
    ],
    reporters: ['default', new AllureReporter({ resultsDir: 'allure-results' })],
    coverage: {
      provider: 'v8',
      include: ['config.js'],
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
      },
    },
  },
});
