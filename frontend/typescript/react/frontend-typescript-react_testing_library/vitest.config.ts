/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const reactUiSrc = resolve(__dirname, '../../../_shared/frontend-react-ui/src/index.ts');
const productRoot = resolve(__dirname, '../frontend-typescript-react');
const sharedRoot = resolve(__dirname, '../../../_shared');

export default defineConfig({
  base: '/frontend-typescript-react/',
  plugins: [react()],
  resolve: {
    alias: {
      '@zero-design-system/react': reactUiSrc,
      // Deduplicate React when importing product sources from the sibling module.
      react: resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
      'react-router': resolve(__dirname, 'node_modules/react-router'),
      'react-router-dom': resolve(__dirname, 'node_modules/react-router-dom'),
    },
  },
  server: {
    fs: {
      allow: [productRoot, sharedRoot],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts', 'allure-vitest/setup'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: true,
    reporters: [
      'default',
      ['allure-vitest/reporter', { resultsDir: 'allure-results' }],
    ],
  },
});
