import '@testing-library/jest-dom/vitest';
import { label } from 'allure-js-commons';
import { beforeEach } from 'vitest';

/** Shared Allure labels for component results (local and CI → TestOps). */
beforeEach(async () => {
  await label('layer', 'component');
  await label('module', 'frontend-typescript-react');
  await label('language', 'typescript');
  await label('scope', 'react');
  await label('framework', 'react_testing_library');
  await label('epic', 'reference-app-copy');
});
