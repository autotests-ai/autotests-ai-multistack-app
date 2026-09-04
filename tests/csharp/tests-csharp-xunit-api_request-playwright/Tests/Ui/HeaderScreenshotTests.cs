using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Helpers;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureSeverity(SeverityLevel.minor)]
[AllureEpic("Header")]
[AllureFeature("Header")]
[AllureSuite("Header")]
[AllureSubSuite("screenshot")]
public sealed class HeaderScreenshotTests : TestBase
{
    private const int ViewportHeight = 900;

    public override void Dispose()
    {
        ViewportHelper.ResetViewport();
        base.Dispose();
    }

    [InlineData(390)]
    [InlineData(768)]
    [InlineData(1280)]
    [Trait("TestCategory", "ui")]
    [Trait("TestCategory", "screenshot")]
    [Theory(DisplayName = "Header bar matches screenshot")]
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
