using Allure.Net.Commons.Attributes;
using Helpers;
using Microsoft.Playwright;

namespace Pages;

public sealed class HomePage : BasePage<HomePage>
{
    private const string DeleteAccountConfirm = "Delete this account? This cannot be undone.";

    public readonly ILocator Layout;
    public readonly ILocator HealthStatus;
    public readonly ILocator ItemsList;
    public readonly ILocator WelcomeMessage;
    public readonly ILocator WelcomePanel;
    public readonly ILocator LogoutButton;
    public readonly ILocator DeleteAccountButton;
    public HeaderPage Header { get; set; } = null!;

    public HomePage(IPage page) : base(page)
    {
        Layout = page.GetByTestId("multistack-layout");
        HealthStatus = page.GetByTestId("health-status");
        ItemsList = page.GetByTestId("items-list");
        WelcomeMessage = page.GetByTestId("welcome-message");
        WelcomePanel = page.GetByTestId("welcome-panel");
        LogoutButton = page.GetByTestId("logout-button");
        DeleteAccountButton = page.GetByTestId("delete-account-button");
    }

    [AllureStep("Open home page")]
    public HomePage OpenPage()
    {
        Pw.Run(_page.GotoAsync("./"));
        return ShouldBeOpen();
    }

    [AllureStep("Verify home layout is open")]
    public override HomePage ShouldBeOpen()
    {
        Pw.Run(Layout.WaitForAsync());
        return this;
    }

    [AllureStep("Verify home layout is mounted")]
    public HomePage ShouldShowLayout()
    {
        Pw.Run(Layout.WaitForAsync());
        Pw.Run(ItemsList.WaitForAsync());
        return this;
    }

    [AllureStep("Verify home layout and health are mounted")]
    public HomePage ShouldShowLayoutAndHealth()
    {
        Pw.Run(Layout.WaitForAsync());
        Pw.Run(HealthStatus.WaitForAsync());
        return this;
    }

    [AllureStep("Verify health and items finished loading")]
    public HomePage ShouldShowSettledHealthAndItems()
    {
        ShouldShowLayoutAndHealth();
        Pw.Run(ItemsList.WaitForAsync());
        Pw.Run(Assertions.Expect(HealthStatus).Not.ToContainTextAsync("Checking health"));
        Pw.Run(Assertions.Expect(ItemsList).Not.ToContainTextAsync("Loading items"));
        return this;
    }

    [AllureStep("Home layout panel is visible")]
    public ILocator LayoutPanel() => Layout;

    [AllureStep("Welcome panel is visible")]
    public ILocator WelcomePanelElement() => WelcomePanel;

    [AllureStep("Verify welcome panel stays hidden")]
    public HomePage ShouldHideWelcomePanel()
    {
        Pw.Run(Assertions.Expect(WelcomePanel).ToHaveAttributeAsync("hidden", ""));
        return this;
    }

    [AllureStep("Verify auth token was cleared from localStorage")]
    public HomePage ShouldClearAuthToken()
    {
        WaitForAuthTokenToBeCleared();
        return this;
    }

    [AllureStep("Verify health status contains: {textFragment}")]
    public HomePage ShouldShowHealthText(string textFragment)
    {
        Pw.Run(Assertions.Expect(HealthStatus).ToContainTextAsync(textFragment));
        return this;
    }

    [AllureStep("Verify items list contains: {textFragment}")]
    public HomePage ShouldShowItemText(string textFragment)
    {
        Pw.Run(Assertions.Expect(ItemsList).ToContainTextAsync(textFragment));
        return this;
    }

    [AllureStep("Verify items panel shows a readable error: {textFragment}")]
    public HomePage ShouldShowItemsError(string textFragment)
    {
        Pw.Run(Assertions.Expect(ItemsList).ToContainTextAsync(textFragment));
        return this;
    }

    [AllureStep("Verify health panel shows a readable error: {textFragment}")]
    public HomePage ShouldShowHealthError(string textFragment)
    {
        Pw.Run(Assertions.Expect(HealthStatus).ToContainTextAsync(textFragment));
        return this;
    }

    [AllureStep("Verify welcome message: {message}")]
    public HomePage ShouldHaveWelcomeMessage(string message)
    {
        Pw.Run(WelcomePanel.WaitForAsync());
        Pw.Run(Assertions.Expect(WelcomeMessage).ToContainTextAsync(message));
        return this;
    }

    [AllureStep("Verify session panel offers logout and delete account")]
    public HomePage ShouldShowSessionActions()
    {
        Pw.Run(Assertions.Expect(LogoutButton).ToBeVisibleAsync());
        Pw.Run(Assertions.Expect(LogoutButton).ToContainTextAsync("Logout"));
        Pw.Run(Assertions.Expect(DeleteAccountButton).ToBeVisibleAsync());
        Pw.Run(Assertions.Expect(DeleteAccountButton).ToContainTextAsync("Delete account"));
        return this;
    }

    [AllureStep("Logout")]
    public LoginPage ClickLogoutButton()
    {
        Pw.Run(LogoutButton.ClickAsync());
        return new LoginPage(_page) { Header = Header };
    }

    [AllureStep("Accept delete-account confirm")]
    public LoginPage ClickDeleteAccountAndConfirm()
    {
        HandleDialog(accept: true);
        Pw.Run(DeleteAccountButton.ClickAsync());
        return new LoginPage(_page) { Header = Header };
    }

    [AllureStep("Cancel delete-account confirm")]
    public HomePage ClickDeleteAccountAndCancel()
    {
        HandleDialog(accept: false);
        Pw.Run(DeleteAccountButton.ClickAsync());
        return this;
    }

    [AllureStep("Verify auth token remains in localStorage")]
    public HomePage ShouldKeepAuthToken()
    {
        VerifyAuthTokenPresent();
        return this;
    }

    [AllureStep("Open home page with local storage authentication")]
    public HomePage OpenPageWithLocalStorageAuthentication(string username, string password) =>
        OpenWithLocalStorageAuth(Authenticate(username, password));

    [AllureStep("Seed localStorage auth token")]
    public HomePage OpenWithLocalStorageAuth(string token)
    {
        OpenPageWithLocalStorageToken("./", token);
        return ShouldBeOpen();
    }

    [AllureStep("Open home with a garbage auth token")]
    public HomePage OpenPageWithInvalidToken() => OpenWithLocalStorageAuth("invalid-token");

    [AllureStep("Reload home")]
    public HomePage ReloadPage()
    {
        Pw.Run(_page.ReloadAsync());
        return ShouldBeOpen();
    }

    private void HandleDialog(bool accept)
    {
        EventHandler<IDialog>? handler = null;
        handler = async (_, dialog) =>
        {
            _page.Dialog -= handler!;
            if (dialog.Message != DeleteAccountConfirm)
            {
                throw new InvalidOperationException(
                    $"Confirm text: expected <{DeleteAccountConfirm}> but was <{dialog.Message}>");
            }

            await (accept ? dialog.AcceptAsync() : dialog.DismissAsync());
        };
        _page.Dialog += handler;
    }
}
