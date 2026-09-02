using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Helpers;
using Tests;

namespace Tests.E2e;

[AllureLabel("layer", "e2e")]
[AllureSeverity(SeverityLevel.minor)]
[AllureEpic("Authentication")]
[AllureFeature("Welcome panel")]
[AllureSuite("Welcome panel")]
[AllureSubSuite("screenshot")]
public sealed class WelcomePanelScreenshotTests : TestBase
{
    private const int ViewportHeight = 900;

    [InlineData(390)]
    [InlineData(768)]
    [InlineData(1280)]
    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "screenshot")]
    [Theory(DisplayName = "Welcome panel matches screenshot")]
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
