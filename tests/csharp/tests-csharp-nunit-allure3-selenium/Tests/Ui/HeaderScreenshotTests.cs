using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Helpers;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureSeverity(SeverityLevel.minor)]
[AllureEpic("Header")]
[AllureFeature("Header")]
[AllureSuite("Header")]
[AllureSubSuite("screenshot")]
[NonParallelizable]
public sealed class HeaderScreenshotTests : TestBase
{
    private const int ViewportHeight = 900;

    [TearDown]
    public void ResetViewport() => ViewportHelper.ResetViewport();

    [TestCase(390)]
    [TestCase(768)]
    [TestCase(1280)]
    [Category("ui")]
    [Category("screenshot")]
    [AllureName("Header bar matches screenshot")]
    public void HeaderBarMatchesScreenshot(int viewportWidth)
    {
        ViewportHelper.SetViewport(viewportWidth, ViewportHeight);
        LoginPage.OpenPage().Header.ShouldShowEmbeddedHeader();
        ScreenshotHelper.CaptureAndCompare(
            LoginPage.Header.HeaderPanel(),
            "header",
            viewportWidth,
            "header-" + viewportWidth);
    }
}
