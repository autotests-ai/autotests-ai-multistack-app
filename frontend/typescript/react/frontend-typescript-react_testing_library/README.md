# frontend-typescript-react_testing_library

Vitest + React Testing Library for [`../frontend-typescript-react/`](../frontend-typescript-react/).

| | |
|--|--|
| Pyramid job | `component_rtl` ([`tests/LAYERS.md`](../../../../tests/LAYERS.md)) |
| Allure | `layer=component`, `scope=react`, `framework=react_testing_library` |

```bash
npm test
```

Imports product sources from the sibling module (pages/lib/pwa). Naming: `-` between
segments, `_` only in the compound `react_testing_library` (see [`tests/NAMING.md`](../../../../tests/NAMING.md)).

Not the browser `@Tag(component)` slice (that hits `frontend/_catalog/frontend-javascript-preview` via Selenide).
