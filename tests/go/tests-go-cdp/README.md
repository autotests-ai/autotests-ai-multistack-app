# tests-go-cdp

IR mill (`role: mill`, `layers: [crystal]`). Not a Selenide / Playwright peer.

```bash
go test
```

Execs `greedy run --cdp --base-url --mode none` on `crystals/*.json`. Does **not** `import` `greedy.guru/greedy/internal/cdp`. No chromedp page objects, no go-playwright, no MCP.

CDP is already-live Chrome (`--remote-allow-origins=*`), not `ensure.py`, not stand `greedy-guru-site`.

| Env | Role |
|-----|------|
| `GREEDY_BIN` | `greedy` binary (else `go build` from `GREEDY_GURU`) |
| `GREEDY_GURU` | greedy.guru module root |
| `GREEDY_CDP` | existing Chrome DevTools HTTP URL |
| `GREEDY_BASE_URL` | SPA origin (default teaching Java/React stack) |
| `CHROME_BIN` | Chrome if `GREEDY_CDP` is unset |
