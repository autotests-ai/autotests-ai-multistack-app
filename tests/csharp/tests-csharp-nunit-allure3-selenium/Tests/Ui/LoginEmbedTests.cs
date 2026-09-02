using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Tests;

namespace Tests.Ui;

[AllureLabel("layer", "ui")]
[AllureEpic("Authentication")]
[AllureFeature("Login embed")]
[AllureSeverity(SeverityLevel.normal)]
[AllureSuite("Login embed")]
public sealed class LoginEmbedTests : TestBase
{
    [Test]
    [Category("ui")]
    [Category("mock")]
    [AllureName("Embedded header is visible on login page")]
    public void EmbeddedHeaderIsVisibleOnLoginPage()
    {
        LoginPage.OpenPage()
            .ShouldHaveFormTitle("Login Form")
            .Header.ShouldShowEmbeddedHeader();
    }
}
