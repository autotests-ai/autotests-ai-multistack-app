using Allure.Net.Commons.Attributes;
using Api;
using Helpers;
using Microsoft.Playwright;

namespace Pages;

public sealed class HomePage
{
    private const string DeleteAccountConfirm = "Delete this account? This cannot be undone.";

    private readonly IPage _page;
    public readonly ILocator Layout;
    public readonly ILocator HealthStatus;
    public readonly ILocator ItemsList;
    public readonly ILocator WelcomeMessage;
    public readonly ILocator WelcomePanel;
    public readonly ILocator LogoutButton;
    public readonly ILocator DeleteAccountButton;
    public HeaderPage Header { get; set; } = null!;

    public HomePage(IPage page)
    {
        _page = page;
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
    public HomePage ShouldBeOpen()
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
        Pw.Run(_page.WaitForFunctionAsync(
            """
            () => {
              const m = location.pathname.match(/\/(backend-[^/]+)\//);
              const key = m ? `authToken:${m[1]}` : 'authToken';
              return localStorage.getItem(key) === null;
            }
            """));
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
        Assert.NotNull(AuthToken());
        return this;
    }

    [AllureStep("Open home page with local storage authentication")]
    public HomePage OpenPageWithLocalStorageAuthentication(string username, string password) =>
        OpenWithLocalStorageAuth(AuthApiClient.Login(username, password));

    [AllureStep("Seed localStorage auth token")]
    public HomePage OpenWithLocalStorageAuth(string token)
    {
        Pw.Run(_page.GotoAsync("login"));
        Pw.Run(_page.GetByTestId("login-form").WaitForAsync());
        var key = AuthTokenKey();
        Pw.Run(_page.EvaluateAsync(
            "arg => localStorage.setItem(arg.key, arg.token)",
            new { key, token }));
        return OpenPage();
    }

    [AllureStep("Open home with a garbage auth token")]
    public HomePage OpenPageWithInvalidToken() => OpenWithLocalStorageAuth("invalid-token");

    [AllureStep("Reload home")]
    public HomePage ReloadPage()
    {
        Pw.Run(_page.ReloadAsync());
        return ShouldBeOpen();
    }

    public string AuthTokenKey() =>
        Pw.Run(_page.EvaluateAsync<string>(
            """
            () => {
              const m = location.pathname.match(/\/(backend-[^/]+)\//);
              return m ? `authToken:${m[1]}` : 'authToken';
            }
            """)) ?? "authToken";

    public string? AuthToken() =>
        Pw.Run(_page.EvaluateAsync<string?>("k => localStorage.getItem(k)", AuthTokenKey()));

    private void HandleDialog(bool accept)
    {
        EventHandler<IDialog>? handler = null;
        handler = (_, dialog) =>
        {
            _page.Dialog -= handler!;
            if (dialog.Message != DeleteAccountConfirm)
            {
                throw new InvalidOperationException(
                    $"Confirm text: expected <{DeleteAccountConfirm}> but was <{dialog.Message}>");
            }

            Pw.Run(accept ? dialog.AcceptAsync() : dialog.DismissAsync());
        };
        _page.Dialog += handler;
    }
}
