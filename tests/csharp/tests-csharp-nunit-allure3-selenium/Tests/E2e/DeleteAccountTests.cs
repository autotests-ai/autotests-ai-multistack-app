using Allure.Net.Commons;
using Allure.NUnit.Attributes;
using Api;
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
    private const string Password = "password123";
    private string? _throwawayUsername;

    [TearDown]
    public void CleanupThrowawayUser()
    {
        if (_throwawayUsername != null)
        {
            AuthApiClient.DeleteAccountQuietly(_throwawayUsername, Password);
            _throwawayUsername = null;
        }
    }

    [Test]
    [Category("e2e")]
    [Category("positive")]
    [AllureName("Confirming delete account clears the session and navigates to login")]
    public void ConfirmingDeleteClearsSessionAndNavigatesToLogin()
    {
        _throwawayUsername = DataFaker.Username();
        AuthApiClient.Register(_throwawayUsername, Password);
        HomePage.OpenPageWithLocalStorageAuthentication(_throwawayUsername, Password)
            .ShouldHaveWelcomeMessage("Welcome, " + _throwawayUsername + "!")
            .ShouldShowSessionActions()
            .ClickDeleteAccountAndConfirm()
            .ShouldHaveFormTitle("Login Form");
        HomePage.ShouldClearAuthToken();
        _throwawayUsername = null;
    }

    [Test]
    [Category("e2e")]
    [Category("positive")]
    [AllureName("Cancelling the confirm keeps the session and sends no delete request")]
    public void CancellingConfirmKeepsSession()
    {
        _throwawayUsername = DataFaker.Username();
        AuthApiClient.Register(_throwawayUsername, Password);
        HomePage.OpenPageWithLocalStorageAuthentication(_throwawayUsername, Password)
            .ShouldHaveWelcomeMessage("Welcome, " + _throwawayUsername + "!")
            .ClickDeleteAccountAndCancel()
            .ShouldHaveWelcomeMessage("Welcome, " + _throwawayUsername + "!")
            .ShouldKeepAuthToken();
        AuthApiClient.Login(_throwawayUsername, Password);
    }
}
