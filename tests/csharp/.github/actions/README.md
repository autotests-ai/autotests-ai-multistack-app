# C# tests CI verbs

Same job names as `ci.yml`. Implementations live here because GitHub does not
interpolate `uses:`.

`tests/.github/actions/<verb>` dispatches here when `TESTS_LANG=csharp`.
Living modules: `tests-csharp-nunit-restsharp` (HTTP-only),
`tests-csharp-nunit-restsharp-selenium` (Selenium + in-cell RestSharp), and
`tests-csharp-xunit-api_request-playwright` (Playwright + in-cell APIRequest). Default
clone `TESTS_*` stays Java Selenide.
Folder id has no report segment (`TESTS_REPORT` stays a CI knob):
`tests-csharp-nunit-restsharp` · `tests-csharp-nunit-restsharp-selenium` ·
`tests-csharp-xunit-api_request-playwright`.

HTTP-only RestSharp: no `mock` / `e2e` in that cell. Selenium and Playwright cells
have ui+e2e locally; clone CI verbs for mock/e2e still STOP until wired (not default CI).

| Verb | Layer |
|------|-------|
| `infra` | `dotnet test --filter TestCategory=infra /p:CollectCoverage=true` — coverlet 100% `Config.ConfigReader` (Selenium / Playwright also `LayoutCss` / `TokensCss`) |
| `sonar` | scan + gate on `coverage.opencover.xml` |
