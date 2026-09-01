# tests-csharp-nunit-allure3-restsharp

NUnit · **RestSharp** · [Allure.NUnit](https://www.nuget.org/packages/Allure.NUnit). HTTP-only school — same `/api` catalog as Java Rest Assured (31 api + 9 ConfigReader + 3 manual). No browser.

Sibling UI blocks: [`tests-csharp-nunit-allure3-selenium`](../tests-csharp-nunit-allure3-selenium/), [`tests-csharp-xunit-allure3-playwright`](../tests-csharp-xunit-allure3-playwright/). Combo with a UI school = generate, not a third folder.

```bash
cd tests/csharp/tests-csharp-nunit-allure3-restsharp
cp .env.example .env   # optional; default STAND=prod → autotests.ai
dotnet test --filter TestCategory=infra
dotnet test --filter TestCategory=api
dotnet test --filter TestCategory=manual
dotnet test
```

Stand is `STAND` (`prod` default) or `BASE_URL` / `API_BASE_URL`. `STAND=ci` → API [http://localhost:8800/](http://localhost:8800/). Categories are slices, not stands.

## Allure

```bash
npx allure generate ./bin/Debug/net8.0/allure-results
```
