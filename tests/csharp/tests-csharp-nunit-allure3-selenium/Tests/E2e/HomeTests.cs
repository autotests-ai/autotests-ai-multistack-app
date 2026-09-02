using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Tests;

namespace Tests.E2e;

[AllureLabel("layer", "e2e")]
[AllureEpic("Home")]
[AllureFeature("Home load")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Home")]
public sealed class HomeTests : TestBase
{
    [Test]
    [Category("e2e")]
    [Category("smoke")]
    [AllureName("Page load fetches health and items from API")]
    public void PageLoadFetchesItems()
    {
        HomePage.OpenPage()
            .ShouldShowHealthText("service: " + Config.ApiHealthService)
            .ShouldShowItemText("Alpha");
    }
}
