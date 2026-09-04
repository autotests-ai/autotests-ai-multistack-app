using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureEpic("Authentication")]
[AllureFeature("Register form")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Register form mount")]
public sealed class RegisterFormTests : TestBase
{
    [Test]
    [Category("ui")]
    [Category("mock")]
    [AllureName("Register form fields and submit are visible")]
    public void RegisterFormIsMounted()
    {
        RegisterPage.OpenPage()
            .ShouldShowRegisterForm()
            .ShouldHaveFormTitle("Register");
    }
}
