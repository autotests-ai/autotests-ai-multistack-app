# C# tests CI verbs

Same job names as `ci.yml`. Implementations live here because GitHub does not
interpolate `uses:`.

`tests/.github/actions/<verb>` dispatches here when `TESTS_LANG=csharp`.
Living modules: `tests-csharp-nunit-allure3-restsharp` (HTTP-only),
`tests-csharp-nunit-allure3-selenium` (Selenium + in-cell RestSharp), and
`tests-csharp-xunit-allure3-playwright` (Playwright + in-cell RestSharp). Default
clone `TESTS_*` stays Java Selenide.
`module_dir` is 4-segment: `tests/csharp/tests-csharp-{framework}-{report}-{ui}`
(`nunit` · `allure3` · `restsharp` | `selenium`; `xunit` · `allure3` · `playwright`).

HTTP-only RestSharp: no `mock` / `e2e` in that cell. Selenium and Playwright cells
have ui+e2e locally; clone CI verbs for mock/e2e still STOP until wired (not default CI).

| Verb | Layer |
|------|-------|
| `infra` | `dotnet test --filter TestCategory=infra /p:CollectCoverage=true` — coverlet 100% `Config.ConfigReader` (Selenium / Playwright also `LayoutCss` / `TokensCss`) |
| `sonar` | scan + gate on `coverage.opencover.xml` |
