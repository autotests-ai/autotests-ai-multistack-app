using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Helpers;
using Tests;

namespace Tests.E2e;

[AllureLabel("layer", "e2e")]
[AllureSeverity(SeverityLevel.minor)]
[AllureEpic("Authentication")]
[AllureFeature("Welcome panel")]
[AllureSuite("Welcome panel")]
[AllureSubSuite("screenshot")]
[NonParallelizable]
public sealed class WelcomePanelScreenshotTests : TestBase
{
    private const int ViewportHeight = 900;

    [TestCase(390)]
    [TestCase(768)]
    [TestCase(1280)]
    [Category("e2e")]
    [Category("screenshot")]
    [AllureName("Welcome panel matches screenshot")]
    public void WelcomePanelMatchesScreenshot(int viewportWidth)
    {
        ViewportHelper.SetViewport(viewportWidth, ViewportHeight);
        var home = LoginPage.OpenPage()
            .FillAndSubmitForm("user1", "password1")
            .ShouldHaveWelcomeMessage("Welcome, " + Config.WelcomeUsername + "!");
        ScreenshotHelper.CaptureAndCompare(
            home.WelcomePanelElement(),
            "welcome-panel",
            viewportWidth,
            "welcome-panel-" + viewportWidth);
    }
}
