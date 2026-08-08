import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

const sharedRoot = resolve(__dirname, '../../_shared');

export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    fs: {
      allow: [__dirname, sharedRoot],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js', 'allure-vitest/setup'],
    include: ['src/test/**/*.test.js'],
    css: true,
    reporters: [
      'default',
      ['allure-vitest/reporter', { resultsDir: 'allure-results' }],
    ],
  },
});
