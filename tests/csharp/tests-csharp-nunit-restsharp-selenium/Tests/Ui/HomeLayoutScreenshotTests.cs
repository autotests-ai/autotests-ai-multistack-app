using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Helpers;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureSeverity(SeverityLevel.minor)]
[AllureEpic("Home")]
[AllureFeature("Home layout")]
[AllureSuite("Home layout screenshot")]
[NonParallelizable]
public sealed class HomeLayoutScreenshotTests : TestBase
{
    private const int ViewportWidth = 1280;
    private const int ViewportHeight = 900;

    [SetUp]
    public void OpenHome()
    {
        ViewportHelper.SetViewport(ViewportWidth, ViewportHeight);
        HomePage.OpenPage().ShouldShowLayoutAndHealth();
    }

    [Test]
    [Category("ui")]
    [Category("screenshot")]
    [AllureName("Home layout matches screenshot at 1280px")]
    public void HomeLayoutMatchesScreenshot()
    {
        ScreenshotHelper.CaptureAndCompare(
            HomePage.LayoutPanel(),
            "home-layout",
            ViewportWidth,
            "home-layout-" + ViewportWidth);
    }
}
