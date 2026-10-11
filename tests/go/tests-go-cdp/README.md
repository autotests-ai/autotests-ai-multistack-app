# tests-go-cdp — IR mill

`role: mill` · `layers: [crystal]` · `in_stack: true` (crystal column on `/stack/`, not a Selenide peer).

**IR SSOT:** `crystals/*.json` here (the prototype mill cell). greedy.guru keeps schema + `login.example.json` only — do not copy mill JSON into guru.

The current `version: 1` contract requires explicit `text.match` (`exact` / `contains`). These Playwright string assertions use `contains` + whitespace normalization; `wait` defaults to `visible`. `value` reads the live form-control property. Keep the CLI and crystals on the same schema revision. Runtime register/delete bindings preserve source provenance; `validate` and `diff` recompute the effective-step fingerprint.

The mill **execs** `greedy run --cdp` (JSON stdout). IR values are literals (`user1` / `reguser1`), not `UserBuilder`. No chromedp page objects, no `import` of greedy.guru `internal/cdp`, no MCP.

```bash
cd tests/go/tests-go-cdp
go test
```

Override: `GREEDY_BIN` · `GREEDY_CDP` · `GREEDY_BASE_URL` · `CHROME_BIN` · `GREEDY_PW_MIN_IMAGE`. CDP is live Chrome DevTools HTTP, not `ensure.py`.
