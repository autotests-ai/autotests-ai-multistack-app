using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureEpic("Authentication")]
[AllureFeature("Login form")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Login form mount")]
public sealed class LoginFormTests : TestBase
{
    [Test]
    [Category("ui")]
    [Category("mock")]
    [AllureName("Login form fields and submit are visible")]
    public void LoginFormIsMounted()
    {
        LoginPage.OpenPage()
            .ShouldShowLoginForm()
            .ShouldHaveFormTitle("Login Form");
    }
}
