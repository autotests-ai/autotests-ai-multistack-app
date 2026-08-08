import '@testing-library/jest-dom/vitest';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { displayName, feature, suite } from 'allure-js-commons';
import { beforeEach } from 'vitest';

// Zoneless app (see src/main.ts), so zone.js/testing is deliberately not loaded:
// TestBed gets `provideZonelessChangeDetection()` from each suite instead.
getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

/** Suite/feature/name for TestOps Suites (epic/layer come from ALLURE_LABEL_* in npm test). */
beforeEach(async (ctx) => {
  const suiteName = ctx.task.suite?.name?.trim();
  if (suiteName) {
    await suite(suiteName);
    await feature(suiteName);
  }

  const testName = ctx.task.name?.trim();
  if (testName) {
    await displayName(testName);
  }
});
