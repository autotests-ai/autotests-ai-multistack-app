# Test coverage (frontend-typescript-react)

C0 lock: **`@vitest/coverage-v8`** on RTL / jsdom. Playwright and Selenide hitting this SPA are **N/A** for the % gate.

Canon: monorepo [`docs/testing/SERVICE-QUALITY-CONTOUR.md`](../../../../../../docs/testing/SERVICE-QUALITY-CONTOUR.md) § C · QG profile [`docs/sonar/QUALITY-GATE-PROFILE.md`](../../../../../../docs/sonar/QUALITY-GATE-PROFILE.md) (`qa-guru-canon`). Do not change `qa-guru-infra-new-code`.

| Scope | Tool | Line gate | Command |
|--------|------|-----------|---------|
| `src/` RTL (excl. `src/test/**`, `src/main.tsx`, `src/styles.ts`) | **`@vitest/coverage-v8`** | thresholds in `vitest.config.ts` (not a CI blocker until C4) | `npx vitest run --coverage` · npm script `test:coverage` = **C1** |
| Playwright / Selenide e2e → this SPA | — | **N/A** | — |

Not this module: c8, Istanbul provider, Codecov, Cobertura, `stacks/` leftover frontend.

## Reports (after C1 collector)

Config already sets `provider: 'v8'`, `reporter: ['text', 'lcov']`, `reportsDirectory: './coverage'` (`coverage/` gitignored).

```bash
npx vitest run --coverage
open coverage/index.html
```

| Artifact | Path |
|----------|------|
| HTML | `coverage/index.html` |
| lcov | `coverage/lcov.info` → `sonar.javascript.lcov.reportPaths` |

CI artifact / Sonar ingest / hard floor = **C2–C4**, not this lock.

## Sonar

| | |
|--|--|
| Host | https://sonar.qa.guru |
| projectKey | `autotests-ai-multistack-app-frontend-typescript-react` |
| Profile | `qa-guru-canon` (overall ≥ 80%) — first frontend floor stays soft; not Java’s 100% JaCoCo |
| Local properties | `sonar-project.properties` (`sonar.javascript.lcov.reportPaths=coverage/lcov.info`) |

`multistack_github-sonar.yml` has no `sonar-frontend` job yet (C3).
