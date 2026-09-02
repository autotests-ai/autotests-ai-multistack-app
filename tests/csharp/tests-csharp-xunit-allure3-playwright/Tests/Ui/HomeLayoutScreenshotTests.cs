using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Helpers;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureSeverity(SeverityLevel.minor)]
[AllureEpic("Home")]
[AllureFeature("Home layout")]
[AllureSuite("Home layout screenshot")]
public sealed class HomeLayoutScreenshotTests : TestBase
{
    private const int ViewportWidth = 1280;
    private const int ViewportHeight = 900;

    public HomeLayoutScreenshotTests()
    {
        ViewportHelper.SetViewport(ViewportWidth, ViewportHeight);
        HomePage.OpenPage().ShouldShowLayoutAndHealth();
    }

    [Trait("TestCategory", "ui")]
    [Trait("TestCategory", "screenshot")]
    [Fact(DisplayName = "Home layout matches screenshot at 1280px")]
    public void HomeLayoutMatchesScreenshot()
    {
        ScreenshotHelper.CaptureAndCompare(
            HomePage.LayoutPanel(),
            "home-layout",
            ViewportWidth,
            "home-layout-" + ViewportWidth);
    }
}
