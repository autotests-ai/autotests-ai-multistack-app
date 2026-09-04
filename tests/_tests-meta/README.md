# tests-java metadata kit

SSOT for e2e test **metadata** (keys, Allure structure, Gradle shape, GHA pins) — **not** the runnable Selenide project.

Runnable tests: `../java/tests-java-junit5-rest_assured-selenide/`.  
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
| `.github/_ethalon/gha-actions.yaml` | Shared GHA action pins (skill `sync-github-workflows-ethalon`). |
| `../../.github/workflows/ci.yml` | One orchestrator (clone = takeaway bytes). Stack knobs in `env:`; host/CD via repo vars. |
| `.github/_new.yml`, `_modified.yml` | Inbox for workflows |
| `src/test/java/_ethalon/ladder/` | Style-ladder reference tests (bootstrap source) |

Skills: `sync-e2e-config-ethalon`, `sync-allurerc-ethalon`, `sync-github-workflows-ethalon`, `sync-gradle-ethalon`, `sync-junit-platform-ethalon`, `sync-gen-env-configs-ethalon`, `add-e2e-config-property`.

Validate etalon config:

```bash
node projects/autotests-ai-multistack-home/autotests-ai-multistack-app/tests/_tests-meta/scripts/validate-allurerc.mjs
```

**Owner (runnable tests):** `../java/tests-java-junit5-rest_assured-selenide/`. Live clone: push via `derive-from-etalon.sh`. Student takeaway: `ai-first-student-workspace/` (`render.sh --preset singlestack`). Products (`autotests-ai-app`, `one-page-form-app`) — runnable only, no `_ethalon` inbox in product trees.
