using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Tests;

namespace Tests.Manual;

/// <summary>
/// Manual cases stored in code (canon — see _contract/pyramid-map.yaml, default.manual = tests/manual).
/// Only browser residual stays here; auth happy path and catalogue order are e2e.
/// Checklist steps for humans; ALLURE_MANUAL marks them for TestOps.
/// </summary>
[AllureLabel("layer", "manual")]
[AllureEpic("Exploratory")]
[AllureFeature("Manual checklist")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Exploratory manual")]
public sealed class ExploratoryManualTests : AllureMeta
{
    [Trait("TestCategory", "manual")]
    [AllureLabel("ALLURE_MANUAL", "true")]
    [Fact(DisplayName = "Home residual: 390px viewport and offline error")]
    public void HomeResidualCharter()
    {
        AllureApi.Step("Open / and let health + items load");
        AllureApi.Step("Narrow the viewport to 390px — cards stack, nothing overflows");
        AllureApi.Step("Kill the network (offline devtools) and reload — items panel shows a readable error, not a blank page");
    }

    [Trait("TestCategory", "manual")]
    [AllureLabel("ALLURE_MANUAL", "true")]
    [Fact(DisplayName = "Security residual: XSS, second tab, JWT expiry")]
    public void SecurityResidualCharter()
    {
        AllureApi.Step("Register with an XSS / HTML payload in the username — Welcome panel and header show escaped text, no alert");
        AllureApi.Step("Sign in in a second tab, logout in the first — observe what the second tab shows on next action");
        AllureApi.Step("Wait for token expiry (or shrink JWT_EXPIRATION_MS on a local stand) — expired session degrades to logged-out, not an error page");
    }
}
