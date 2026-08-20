# Visual snapshots — stand folder, native runner

**Do not mix runners** (no Playwright inside the Java-Selenide canon, no Selenide inside selenoid-ui).

| Mode folder | Stand | CI |
|-------|--------|-----|
| **mock** / **ui-mock** | UI without live backend / hub | early, cheap, every PR |
| **stage** | live stage (Java Selenide) | after the stage stand |
| **prod** | live prod (Java Selenide). Local compose (`ci`) reads this tree | after the prod stand |
| **e2e** | live app / hub — selenoid-ui and stacks that have not split stage/prod yet | after the stand |

Folders: **mode first, then OS** (Java adds `{browser}-{major}` after OS).

```
{mode}/{macos|linux|windows}/
```

`VISUAL_OS` overrides the OS folder (`darwin` → `macos`, `linux` → `linux`, `win32` → `windows`).

## Multistack ethalon — Selenide

Target:

```
projects/autotests-ai-multistack-home/autotests-ai-multistack-app/tests/java/tests-java-gradle-junit5-allure3-selenide/src/test/resources/screenshots/{mock|stage|prod}/{linux|macos|windows}/{chrome-148}/{area}/{viewport}.png
```

Living today: `screenshots/{mock|stage|prod}/{os}/{chrome-148}/{area}/` — same `@Tag("screenshot")` tests, folder from `-Denv` (`mock` → `mock/`, `stage` → `stage/`, `prod` and `ci` → `prod/`). Browser-major folders sit side by side (`chrome-148/` next to a future `firefox-140/`). Write mode: `-DupdateScreenshots=true`. OS/browser folder env: `SCREENSHOT_OS` / `SCREENSHOT_BROWSER` (default `chrome`).

`frontend/typescript/frontend-typescript-react/` Vitest/RTL is **not** visual. Do not add `@playwright/test` there.

## selenoid-ui — Playwright (`ui/`)

Target:

```
ui/visual/snapshots/{mock|e2e}/{macos|linux}/
```

Living today: `ui/visual/snapshots/{os}/` — **mock** (`?mock=1`, Vite-dev). e2e vs live hub is not implemented.

Helper: `ui/src/lib/visualOs.ts`. CI: `ci/test.sh` runs mock visual before production `vite build`.

## Other test stacks (later)

`tests-js` (Playwright), `tests-python`, … — `{mode}/{os}/` with that stack’s runner. Split `stage/` vs `prod/` when the stack has both stands; until then `e2e/` is the live tree.

## Don't

- Playwright visual in `frontend/typescript/frontend-typescript-react/`
- One PNG tree for mock + stage + prod
- One PNG set for stage + prod
- One PNG set for macOS + Linux CI
- One PNG set for Chrome + Firefox
- Suffix like `login-linux.png` / `login-chrome.png` instead of OS / `{browser}-{major}` folders
