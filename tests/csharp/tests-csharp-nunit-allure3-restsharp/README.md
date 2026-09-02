# tests-csharp-nunit-allure3-restsharp

NUnit · **RestSharp** · [Allure.NUnit](https://www.nuget.org/packages/Allure.NUnit). HTTP-only school — same `/api` catalog as Java Rest Assured (31 api + 9 ConfigReader + 3 manual). No browser.

Sibling UI school: [`tests-csharp-nunit-allure3-selenium`](../tests-csharp-nunit-allure3-selenium/) (Selenium + **in-cell** RestSharp). xUnit Playwright stays a slot. Combo with that UI school = generate, not a third folder.

```bash
cd tests/csharp/tests-csharp-nunit-allure3-restsharp
cp .env.example .env   # optional; default STAND=prod → autotests.ai
dotnet test --filter TestCategory=infra
dotnet test --filter TestCategory=infra /p:CollectCoverage=true
dotnet test --filter TestCategory=api
dotnet test --filter TestCategory=manual
dotnet test
```

`/p:CollectCoverage=true` is Coverlet fail-under **100%** line on `Config.ConfigReader` (csproj). CI `sonar-tests` reads `coverage.opencover.xml` via [`sonar-project.properties`](sonar-project.properties). HTTP-only: no `mock` / `e2e` in this cell.

Stand is `STAND` (`prod` default) or `BASE_URL` / `API_BASE_URL`. `STAND=ci` → API [http://localhost:8800/](http://localhost:8800/). Categories are slices, not stands.

## Allure

```bash
npx allure generate ./bin/Debug/net8.0/allure-results
```
