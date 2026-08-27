# tests-go-cdp — IR mill

`role: mill` · `layers: [crystal]` · `in_stack: true` (crystal column on `/stack/`, not a Selenide peer).

Crystals in git. The mill **execs** `greedy run --cdp` (JSON stdout). IR values are literals (`user1` / `reguser1`), not `UserBuilder`. No chromedp page objects, no `import` of greedy.guru `internal/cdp`, no MCP.

```bash
cd tests/go/tests-go-cdp
go test
```

Override: `GREEDY_BIN` · `GREEDY_CDP` · `GREEDY_BASE_URL` · `CHROME_BIN` · `GREEDY_PW_MIN_IMAGE`. CDP is live Chrome DevTools HTTP, not `ensure.py`.
