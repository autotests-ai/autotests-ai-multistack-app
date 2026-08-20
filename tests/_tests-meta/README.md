# tests-java metadata kit

SSOT for e2e test **metadata** (keys, takeaway CI, Allure structure, Gradle shape) — **not** the runnable Selenide project.

Runnable tests: `../java/tests-java-gradle-junit5-allure3-selenide/`.  
README badges / dashboard blocks: monorepo `generators/ethalon/readme/` (not this kit). Consumer repos keep runnable copies only (`allurerc.mjs` + `allure/`, env profiles, workflows, `scripts/gen-env-configs.py`).

| Path | Role |
|------|------|
| `src/test/resources/config/_ethalon.properties` | Max-key config schema + section order |
| `src/test/resources/config/_new.properties` | Inbox: new keys from consumers (skill `sync-e2e-config-ethalon` §5) |
| `src/test/resources/config/_modified.properties` | Inbox: key renames (§6) |
| `src/test/resources/junit-platform.properties` | JUnit 5 parallel settings (skill `sync-junit-platform-ethalon`) |
| `_new.junit-platform.properties`, `_modified.junit-platform.properties` | Inbox for junit-platform |
| `scripts/_ethalon/gen-env-configs.py` | Env profile generator structure (skill `sync-gen-env-configs-ethalon`) |
| `_new.gen-env-configs.py`, `_modified.gen-env-configs.py` | Inbox for gen-env-configs |
| `_ethalon/allure/*.mjs` | Allure 3 structural modules (ADR 006) — incl. `overview-preset.mjs` |
| `_ethalon/allurerc.mjs` | Runnable etalon placeholder (`createAllureConfig`) |
| `scripts/validate-allurerc.mjs` | Overview preset @ 0–3 + pyramid layers lint |
| `scripts/check-package-lock.mjs` | Exact pins in `package.json` must match `package-lock.json` (`npm ci`) |
| `_new.mjs`, `_modified.mjs` | Inbox for allurerc (skill `sync-allurerc-ethalon`) |
| `_ethalon/build.gradle` | Gradle structure (deps, tasks, Allure wiring, pyramid slices) |
| `_ethalon/versions.yaml` | Shared Java stack pins (java/gradle/junit/slf4j/spring-boot) — bump here first; rule `java-stack-versions` |
| `_new.gradle`, `_modified.gradle` | Inbox for build.gradle (skill `sync-gradle-ethalon`) |
| `.github/_ethalon/singlestack_github.yml` | Thin default-stack orchestrator (flat paths, ai-first stand). Copy as takeaway `.github/workflows/ci.yml`. Notes: `singlestack_github.md`. **Не** копировать поверх matrix clone `ci.yml`. |
| `.github/_ethalon/gha-actions.yaml` | Shared GHA action pins (skill `sync-github-workflows-ethalon`). Unified `{env_base}-ci.yml` **нет**. Matrix teaching SSOT is clone `ci.yml`. |
| `../../.github/_ethalon/catalog_github.yml` | Catalog CD for matrix clone SPA sidecars (not this tests kit). Copy as clone `.github/workflows/catalog_github.yml`. **Не** складывать в teaching `ci.yml`. |
| `.github/_new.yml`, `_modified.yml` | Inbox for workflows |
| `src/test/java/_ethalon/ladder/` | Style-ladder reference tests (bootstrap source) |

Skills: `sync-e2e-config-ethalon`, `sync-allurerc-ethalon`, `sync-github-workflows-ethalon`, `sync-gradle-ethalon`, `sync-junit-platform-ethalon`, `sync-gen-env-configs-ethalon`, `add-e2e-config-property`.

Validate etalon config:

```bash
node projects/autotests-ai-multistack-home/autotests-ai-multistack-app/tests/_tests-meta/scripts/validate-allurerc.mjs
```

**Owner (runnable tests):** `../java/tests-java-gradle-junit5-allure3-selenide/`. Live clone: push via `derive-from-etalon.sh`. Student takeaway: `ai-first-student-workspace/` (`render.sh --preset singlestack`). Products (`autotests-ai-app`, `one-page-form-app`) — runnable only, no `_ethalon` inbox in product trees.
