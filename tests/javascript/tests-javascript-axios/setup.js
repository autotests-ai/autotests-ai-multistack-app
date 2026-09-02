/** Allure layer from Vitest tags (LAYERS.md). No browser. */

import { displayName, feature, label, suite } from 'allure-js-commons';
import { beforeEach } from 'vitest';

function tagNames(ctx) {
  const raw = ctx.task.tags;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((tag) => String(tag).replace(/^@/, ''));
}

beforeEach(async (ctx) => {
  const tags = tagNames(ctx);
  if (tags.includes('api')) {
    await label('layer', 'api');
  } else if (tags.includes('manual')) {
    await label('layer', 'manual');
    await label('ALLURE_MANUAL', 'true');
  } else if (tags.includes('infra') || tags.includes('infra_backend')) {
    await label('layer', 'infra');
  }

  await label('language', 'javascript');
  await label('framework', 'axios');
  await label('module', 'tests-javascript-axios');

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
