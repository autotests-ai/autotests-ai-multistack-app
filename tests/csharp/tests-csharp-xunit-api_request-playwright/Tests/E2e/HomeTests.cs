using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Tests;

namespace Tests.E2e;

[AllureLabel("layer", "e2e")]
[AllureEpic("Home")]
[AllureFeature("Home load")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Home")]
public sealed class HomeTests : TestBase
{
    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "smoke")]
    [Fact(DisplayName = "Home loads health and seed items")]
    public void PageLoadFetchesItems()
    {
        HomePage.OpenPage()
            .ShouldShowHealthText("service: " + Config.ApiHealthService)
            .ShouldShowItemText("Alpha");
    }
}
