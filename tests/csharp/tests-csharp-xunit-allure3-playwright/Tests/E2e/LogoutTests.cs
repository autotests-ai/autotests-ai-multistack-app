using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Tests;

namespace Tests.E2e;

[AllureLabel("layer", "e2e")]
[AllureEpic("Authentication")]
[AllureFeature("Logout")]
[AllureSeverity(SeverityLevel.critical)]
[AllureSuite("Logout")]
public sealed class LogoutTests : TestBase
{
    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "positive")]
    [Fact(DisplayName = "User can logout after form login")]
    public void ShouldLogoutAfterFormLogin()
    {
        LoginPage.OpenPage()
            .FillAndSubmitForm("user1", "password1")
            .ShouldHaveWelcomeMessage("Welcome, user1!")
            .ShouldShowSessionActions();
        HomePage.ClickLogoutButton()
            .ShouldHaveFormTitle("Login Form");
    }

    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "positive")]
    [Fact(DisplayName = "User can logout after localStorage authentication")]
    public void ShouldLogoutAfterLocalStorageAuthentication()
    {
        HomePage.OpenPageWithLocalStorageAuthentication("user1", "password1")
            .ShouldHaveWelcomeMessage("Welcome, user1!")
            .ShouldShowSessionActions();
        HomePage.ClickLogoutButton()
            .ShouldHaveFormTitle("Login Form");
    }
}
