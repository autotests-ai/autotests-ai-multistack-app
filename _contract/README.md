# Shared contract (all stacks)

SSOT for **behavior** — not language-specific code.

| Artifact | Path | Status |
|----------|------|--------|
| Pyramid layer map | `pyramid-map.yaml` | active — unit · **component = RTL** (CI `component-tests`) · integration (backend `src/test`) · e2e · OpenAPI |
| UI manifest | `ui.manifest.yaml` | active — `designSystem.path` only (no HTML `screens`; `wire-ui.sh` STOPs if `SCREENS` is set) |
| UI visual snapshots | `visual-snapshots.md` | stand folders (Java: mock + stage + prod; others: mock + e2e) × native runner × `{os}/` |
| Login flow | `flows/login.md` | active |
| OpenAPI | `openapi.yaml` | active — matches `AuthController` + `ApiController` · lint `scripts/openapi-diff.py` |
| DB schema | [`../backend/java/backend-java-spring/src/main/resources/db/migration/`](../backend/java/backend-java-spring/src/main/resources/db/migration/) | active — Flyway |
| Matrix catalog | [`../../matrix.yaml`](../../matrix.yaml) | **v0.5.2** — backends / frontends / tests + cells + `generation_gates` · index [`docs/testing/MATRIX-CATALOG.md`](../../../../docs/testing/MATRIX-CATALOG.md) |

**Layer disambiguation:** `component` = Vitest + React Testing Library in `frontend/typescript/frontend-typescript-react/` (CI job `component-tests`, do not rename). `integration` = backend `src/test` (`@Tag("integration")`). Rest Assured against a stand is the **api** layer in `tests/…/tests/api`. Living contract gate = OpenAPI.

Live teaching product: `projects/autotests-ai-multistack-home/autotests-ai-multistack-app/` (nested clone).
Runnable ethalon: `projects/autotests-ai-multistack-home/autotests-ai-multistack-app/` (`backend/java/backend-java-spring`, `frontend/typescript/frontend-typescript-react`, `tests/java/tests-java-junit5-rest_assured-selenide`).

`derive-from-etalon.sh` pushes ethalon → live clone modules.
