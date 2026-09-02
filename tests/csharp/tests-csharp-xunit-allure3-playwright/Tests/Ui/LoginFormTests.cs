using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureEpic("Authentication")]
[AllureFeature("Login form")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Login form mount")]
public sealed class LoginFormTests : TestBase
{
    [Trait("TestCategory", "ui")]
    [Trait("TestCategory", "mock")]
    [Fact(DisplayName = "Login form fields and submit are visible")]
    public void LoginFormIsMounted()
    {
        LoginPage.OpenPage()
            .ShouldShowLoginForm()
            .ShouldHaveFormTitle("Login Form");
    }
}
