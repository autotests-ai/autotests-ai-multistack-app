using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureEpic("Authentication")]
[AllureFeature("Register form")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Register form mount")]
public sealed class RegisterFormTests : TestBase
{
    [Trait("TestCategory", "ui")]
    [Trait("TestCategory", "mock")]
    [Fact(DisplayName = "Register form fields and submit are visible")]
    public void RegisterFormIsMounted()
    {
        RegisterPage.OpenPage()
            .ShouldShowRegisterForm()
            .ShouldHaveFormTitle("Register");
    }
}
