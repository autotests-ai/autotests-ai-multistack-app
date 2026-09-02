using Allure.Net.Commons;
using Allure.Net.Commons.Attributes;
using Helpers;
using Tests;

namespace Tests.E2e;

[AllureLabel("layer", "e2e")]
[AllureEpic("Authentication")]
[AllureFeature("Delete account")]
[AllureSeverity(SeverityLevel.critical)]
[AllureSuite("Delete account")]
public sealed class DeleteAccountTests : TestBase
{
    [Trait("TestCategory", "e2e")]
    [Trait("TestCategory", "positive")]
    [Fact(DisplayName = "User can delete the account from home")]
    public void ShouldDeleteAccount()
    {
        var user = new UserBuilder().WithUsername().WithPassword().Build();
        RegisterPage.OpenPage().Signup(user.Username, user.Password);
        HomePage.ShouldHaveWelcomeMessage(user.WelcomeMessage())
            .ClickDeleteAccountAndConfirm()
            .ShouldHaveFormTitle("Login Form");
    }

    [Trait("TestCategory", "e2e")]
    [Fact(DisplayName = "Cancelling the confirm keeps the session")]
    public void CancellingConfirmKeepsSession()
    {
        var user = new UserBuilder().WithUsername().WithPassword().Build();
        RegisterPage.OpenPage().Signup(user.Username, user.Password);
        HomePage.ShouldHaveWelcomeMessage(user.WelcomeMessage())
            .ClickDeleteAccountAndCancel()
            .ShouldHaveWelcomeMessage(user.WelcomeMessage())
            .ShouldKeepAuthToken()
            .ClickDeleteAccountAndConfirm()
            .ShouldHaveFormTitle("Login Form");
    }
}
