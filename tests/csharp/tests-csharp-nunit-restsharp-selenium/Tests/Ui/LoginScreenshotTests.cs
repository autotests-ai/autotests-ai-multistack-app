using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Helpers;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureSeverity(SeverityLevel.minor)]
[AllureEpic("Authentication")]
[AllureFeature("Login form")]
[AllureSuite("Login")]
[AllureSubSuite("screenshot")]
[NonParallelizable]
public sealed class LoginScreenshotTests : TestBase
{
    private const int ViewportHeight = 900;

    [TestCase(390)]
    [TestCase(768)]
    [TestCase(1280)]
    [Category("ui")]
    [Category("screenshot")]
    [AllureName("Login form matches screenshot")]
    public void LoginFormMatchesScreenshot(int viewportWidth)
    {
        ViewportHelper.SetViewport(viewportWidth, ViewportHeight);
        LoginPage.OpenPage();
        ScreenshotHelper.CaptureAndCompare(
            LoginPage.LoginFormPanel(),
            "login",
            viewportWidth,
            "login-" + viewportWidth);
    }
}
