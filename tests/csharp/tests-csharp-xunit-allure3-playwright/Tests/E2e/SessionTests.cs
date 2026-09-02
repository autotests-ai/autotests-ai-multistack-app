using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Tests;

namespace Tests.E2e;

[AllureLabel("layer", "e2e")]
[AllureEpic("Authentication")]
[AllureFeature("Session")]
[AllureSeverity(SeverityLevel.critical)]
[AllureSuite("Session")]
public sealed class SessionTests : TestBase
{
    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "negative")]
    [Fact(DisplayName = "Invalid token clears session and hides welcome")]
    public void InvalidTokenClearsSession()
    {
        HomePage.OpenPageWithInvalidToken()
            .ShouldHideWelcomePanel()
            .ShouldClearAuthToken();
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "positive")]
    [Fact(DisplayName = "Session survives a page reload (token in localStorage)")]
    public void SessionSurvivesReload()
    {
        HomePage.OpenPageWithLocalStorageAuthentication("user1", "password1")
            .ShouldHaveWelcomeMessage("Welcome, user1!")
            .ReloadPage()
            .ShouldHaveWelcomeMessage("Welcome, user1!");
    }
}
