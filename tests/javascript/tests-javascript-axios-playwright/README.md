# tests-javascript-axios-playwright

`status: bad-practice` · Axios + Playwright (`layers: [api, ui, e2e]`).

Do not fill. Axios inside Playwright is the anti-pattern. Playwright HTTP in-cell is **APIRequest**.

Living combo: [`tests-javascript-api_request-playwright`](../tests-javascript-api_request-playwright/). HTTP-only Axios stays **active**: [`tests-javascript-axios`](../tests-javascript-axios/). UI-only Playwright living: [`tests-javascript-playwright`](../tests-javascript-playwright/).

Not a generate sibling. Not student emit.
