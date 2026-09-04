using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Helpers;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureSeverity(SeverityLevel.minor)]
[AllureEpic("Header")]
[AllureFeature("Burger menu")]
[AllureSuite("Burger menu")]
[AllureSubSuite("screenshot")]
public sealed class BurgerMenuScreenshotTests : TestBase
{
    private const int ViewportHeight = 900;

    public override void Dispose()
    {
        ViewportHelper.ResetViewport();
        base.Dispose();
    }

    [InlineData(390)]
    [InlineData(768)]
    [Trait("TestCategory", "ui")]
    [Trait("TestCategory", "screenshot")]
    [Theory(DisplayName = "Open burger menu matches screenshot")]
    public void OpenMenuMatchesScreenshot(int viewportWidth)
    {
        ViewportHelper.SetViewport(viewportWidth, ViewportHeight);
        LoginPage.OpenPage().Header.OpenMenu();
        ScreenshotHelper.CaptureAndCompare(
            LoginPage.Header.MenuPanel(),
            "burger-menu",
            viewportWidth,
            "burger-menu-" + viewportWidth);
    }
}
