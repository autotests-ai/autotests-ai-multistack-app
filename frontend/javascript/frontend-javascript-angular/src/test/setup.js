// `@angular/compiler` must publish the JIT facade before `@angular/core` compiles
// any `@Component` metadata — Babel emits no AOT output. No `zone.js` import here
// either: the app is zoneless (README, "Signals, not zone.js").
import '@angular/compiler';
import '@testing-library/jest-dom/vitest';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { displayName, feature, suite } from 'allure-js-commons';
import { afterEach, beforeEach } from 'vitest';

TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting(), {
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

// Vitest has no jasmine/karma wrapper to reset TestBed between specs.
afterEach(() => {
  TestBed.resetTestingModule();
});

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
