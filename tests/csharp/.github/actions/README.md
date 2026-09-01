# C# tests CI verbs

Same job names as `ci.yml`. Implementations live here because GitHub does not
interpolate `uses:`.

`tests/.github/actions/<verb>` dispatches here when `TESTS_LANG=csharp`.
Live module: `tests-csharp-nunit-allure3-restsharp` (HTTP-only).
`module_dir` is 4-segment: `tests/csharp/tests-csharp-{framework}-{report}-{ui}`
(`nunit` · `allure3` · `restsharp`).

HTTP-only: no `mock` / `e2e` in this family (dispatcher STOP — not a UI cell).

| Verb | Layer |
|------|-------|
| `infra` | `dotnet test --filter TestCategory=infra /p:CollectCoverage=true` — coverlet 100% `Config.ConfigReader` |
| `sonar` | scan + gate on `coverage.opencover.xml` |
