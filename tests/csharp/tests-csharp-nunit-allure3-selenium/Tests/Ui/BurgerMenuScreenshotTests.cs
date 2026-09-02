using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Helpers;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureSeverity(SeverityLevel.minor)]
[AllureEpic("Header")]
[AllureFeature("Burger menu")]
[AllureSuite("Burger menu")]
[AllureSubSuite("screenshot")]
[NonParallelizable]
public sealed class BurgerMenuScreenshotTests : TestBase
{
    private const int ViewportHeight = 900;

    [TearDown]
    public void ResetViewport() => ViewportHelper.ResetViewport();

    [TestCase(390)]
    [TestCase(768)]
    [Category("ui")]
    [Category("screenshot")]
    [AllureName("Open burger menu matches screenshot")]
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
