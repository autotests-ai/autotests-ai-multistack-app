using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Tests;

namespace Tests.E2e;

[AllureLabel("layer", "e2e")]
[AllureEpic("Authentication")]
[AllureFeature("Logout")]
[AllureSeverity(SeverityLevel.critical)]
[AllureSuite("Logout")]
public sealed class LogoutTests : TestBase
{
    [Test]
    [Category("e2e")]
    [Category("positive")]
    [AllureName("User can logout after form login")]
    public void ShouldLogoutAfterFormLogin()
    {
        LoginPage.OpenPage()
            .FillAndSubmitForm("user1", "password1")
            .ShouldHaveWelcomeMessage("Welcome, user1!")
            .ShouldShowSessionActions();
        HomePage.ClickLogoutButton()
            .ShouldHaveFormTitle("Login Form");
    }

    [Test]
    [Category("e2e")]
    [Category("positive")]
    [AllureName("User can logout after localStorage authentication")]
    public void ShouldLogoutAfterLocalStorageAuthentication()
    {
        HomePage.OpenPageWithLocalStorageAuthentication("user1", "password1")
            .ShouldHaveWelcomeMessage("Welcome, user1!")
            .ShouldShowSessionActions();
        HomePage.ClickLogoutButton()
            .ShouldHaveFormTitle("Login Form");
    }
}
