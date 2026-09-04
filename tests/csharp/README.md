# C# tests

Pattern: see [../NAMING.md](../NAMING.md). **UI-only** slots: `tests-csharp-nunit-selenium`, `tests-csharp-xunit-playwright`. Do not put `allure2` / `allure3` in the folder id.

| Folder | Status |
|--------|--------|
| `tests-csharp-nunit-restsharp-selenium` | **active** — UI+HTTP NUnit · Selenium + in-cell RestSharp; coverlet + `sonar-tests` |
| `tests-csharp-nunit-selenium` | slot — **UI-only** NUnit · Selenium (no REST) |
| `tests-csharp-nunit-restsharp` | **active** — HTTP block NUnit · RestSharp; coverlet + `sonar-tests` |
| `tests-csharp-xunit-api_request-playwright` | **active** — UI+HTTP xUnit · Playwright + in-cell APIRequest; coverlet + `sonar-tests` |
| `tests-csharp-xunit-playwright` | slot — **UI-only** xUnit · Playwright (no REST) |

