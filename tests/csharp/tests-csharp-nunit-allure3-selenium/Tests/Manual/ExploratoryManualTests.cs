using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Tests;

namespace Tests.Manual;

/// <summary>
/// Manual cases stored in code (canon — see ethalon/_contract/pyramid-map.yaml).
/// Checklist steps for humans; ALLURE_MANUAL marks them for TestOps.
/// </summary>
[AllureLabel("layer", "manual")]
[AllureEpic("Exploratory")]
[AllureFeature("Manual checklist")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Exploratory manual")]
public sealed class ExploratoryManualTests : AllureMeta
{
    [Test]
    [Category("manual")]
    [AllureLabel("ALLURE_MANUAL", "true")]
    [AllureName("Auth happy path across login → home → logout")]
    public void AuthHappyPathChecklist()
    {
        AllureApi.Step("Open /login and sign in as seeded user1 / password1");
        AllureApi.Step("Confirm welcome panel shows Welcome, user1!");
        AllureApi.Step("Logout and land on /login with empty session");
    }

    [Test]
    [Category("manual")]
    [AllureLabel("ALLURE_MANUAL", "true")]
    [AllureName("Items catalogue: content, order and resilience charter")]
    public void ItemsCatalogueCharter()
    {
        AllureApi.Step("Open / and let health + items load");
        AllureApi.Step("Check items render Alpha, Beta, Gamma in stable id order with descriptions");
        AllureApi.Step("Narrow the viewport to 390px — cards stack, nothing overflows");
        AllureApi.Step("Kill the network (offline devtools) and reload — items panel shows a readable error, not a blank page");
    }

    [Test]
    [Category("manual")]
    [AllureLabel("ALLURE_MANUAL", "true")]
    [AllureName("Session and token edge cases charter")]
    public void SessionTokenCharter()
    {
        AllureApi.Step("Sign in, reload — welcome survives (token in localStorage)");
        AllureApi.Step("Replace the stored token with garbage in devtools, reload — session is cleared, no crash");
        AllureApi.Step("Sign in in a second tab, logout in the first — observe what the second tab shows on next action");
        AllureApi.Step("Wait for token expiry (or shrink JWT_EXPIRATION_MS on a local stand) — expired session degrades to logged-out, not an error page");
    }
}
